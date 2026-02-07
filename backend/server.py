from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request, Response, Query
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import os
import uuid
import logging
import json
import asyncio
import httpx
from pathlib import Path

from ai_engine import analyze_message, summarize_call_llm
from call_simulator import SimulationEngine, AGENT_PROFILES

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ─── WebSocket Connection Manager ───
class ConnectionManager:
    def __init__(self):
        self.connections: set = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.add(ws)

    def disconnect(self, ws: WebSocket):
        self.connections.discard(ws)

    async def broadcast(self, message: dict):
        dead = set()
        for ws in self.connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        self.connections -= dead

ws_manager = ConnectionManager()
simulation: Optional[SimulationEngine] = None


# ─── Pydantic Models ───
class SupervisorAction(BaseModel):
    action: str  # flag, note, transfer, suggestion
    details: str = ""


class SimulationConfig(BaseModel):
    num_calls: Optional[int] = None
    issue_frequency: Optional[float] = None
    sentiment_distribution: Optional[str] = None
    message_interval: Optional[int] = None


class TriggerEvent(BaseModel):
    event_type: str  # angry_customer, escalation_request, compliance_issue


# ─── Auth Helper ───
async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ─── Auth Endpoints ───
@api_router.get("/auth/session")
async def auth_session(session_id: str, response: Response):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient() as http_client:
        result = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    if result.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    user_data = result.json()

    existing = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture", ""),
            "role": "supervisor",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = user_data.get("session_token", f"st_{uuid.uuid4().hex}")
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60,
    )
    return {"user_id": user_id, "email": user_data["email"], "name": user_data["name"], "picture": user_data.get("picture", "")}


@api_router.get("/auth/me")
async def auth_me(request: Request):
    return await get_current_user(request)


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out"}


# ─── Call Endpoints ───
@api_router.get("/calls/active")
async def get_active_calls(request: Request):
    await get_current_user(request)
    calls = await db.calls.find(
        {"status": {"$in": ["active", "ringing", "on_hold", "wrapping_up"]}},
        {"_id": 0, "call_id": 1, "status": 1, "channel": 1, "started_at": 1,
         "customer": 1, "agent": 1, "health_score": 1, "duration_seconds": 1,
         "ai_summary": 1, "alerts_triggered": 1, "transcript": {"$slice": -1}}
    ).sort("started_at", -1).to_list(50)
    return calls


@api_router.get("/calls/history")
async def get_call_history(request: Request, limit: int = 50, skip: int = 0):
    await get_current_user(request)
    calls = await db.calls.find(
        {"status": "ended"},
        {"_id": 0, "transcript": 0, "_scenario": 0, "_message_index": 0, "_last_message_time": 0, "_created_at": 0}
    ).sort("ended_at", -1).skip(skip).limit(limit).to_list(limit)
    return calls


@api_router.get("/calls/{call_id}")
async def get_call_detail(call_id: str, request: Request):
    await get_current_user(request)
    call = await db.calls.find_one(
        {"call_id": call_id},
        {"_id": 0, "_scenario": 0, "_message_index": 0, "_last_message_time": 0, "_created_at": 0}
    )
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@api_router.get("/calls/{call_id}/transcript")
async def get_call_transcript(call_id: str, request: Request, skip: int = 0, limit: int = 100):
    await get_current_user(request)
    call = await db.calls.find_one(
        {"call_id": call_id},
        {"_id": 0, "transcript": {"$slice": [skip, limit]}}
    )
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call.get("transcript", [])


@api_router.post("/calls/{call_id}/action")
async def perform_call_action(call_id: str, action: SupervisorAction, request: Request):
    user = await get_current_user(request)
    call = await db.calls.find_one({"call_id": call_id}, {"_id": 0, "call_id": 1})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    action_doc = {
        "action": action.action,
        "details": action.details,
        "performed_by": user["user_id"],
        "performed_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.calls.update_one(
        {"call_id": call_id},
        {"$push": {"supervisor_actions": action_doc}}
    )
    await ws_manager.broadcast({
        "type": "supervisor_action",
        "data": {"call_id": call_id, "action": action_doc}
    })
    return {"message": f"Action '{action.action}' performed on {call_id}"}


# ─── Alert Endpoints ───
@api_router.get("/alerts")
async def get_active_alerts(request: Request, limit: int = 50):
    await get_current_user(request)
    alerts = await db.alerts.find(
        {"status": "active"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return alerts


@api_router.get("/alerts/history")
async def get_alert_history(request: Request, limit: int = 100, skip: int = 0):
    await get_current_user(request)
    alerts = await db.alerts.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return alerts


@api_router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.alerts.update_one(
        {"alert_id": alert_id, "status": "active"},
        {"$set": {
            "status": "acknowledged",
            "acknowledged_by": user["user_id"],
            "acknowledged_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found or already acknowledged")
    await ws_manager.broadcast({"type": "alert_acknowledged", "data": {"alert_id": alert_id}})
    return {"message": "Alert acknowledged"}


@api_router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, request: Request, notes: str = ""):
    user = await get_current_user(request)
    result = await db.alerts.update_one(
        {"alert_id": alert_id},
        {"$set": {
            "status": "resolved",
            "resolution_notes": notes,
            "acknowledged_by": user["user_id"],
            "acknowledged_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    await ws_manager.broadcast({"type": "alert_resolved", "data": {"alert_id": alert_id}})
    return {"message": "Alert resolved"}


# ─── Agent Endpoints ───
@api_router.get("/agents")
async def get_agents(request: Request):
    await get_current_user(request)
    agents = await db.agents.find({}, {"_id": 0}).to_list(50)
    return agents


@api_router.get("/agents/{agent_id}")
async def get_agent_detail(agent_id: str, request: Request):
    await get_current_user(request)
    agent = await db.agents.find_one({"agent_id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@api_router.get("/agents/{agent_id}/calls")
async def get_agent_calls(agent_id: str, request: Request, limit: int = 20):
    await get_current_user(request)
    calls = await db.calls.find(
        {"agent.id": agent_id},
        {"_id": 0, "transcript": 0, "_scenario": 0, "_message_index": 0, "_last_message_time": 0, "_created_at": 0}
    ).sort("started_at", -1).limit(limit).to_list(limit)
    return calls


# ─── Analytics Endpoints ───
@api_router.get("/analytics/realtime")
async def get_realtime_analytics(request: Request):
    await get_current_user(request)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    # Single aggregation for active call metrics
    pipeline = [
        {"$match": {"status": {"$in": ["active", "ringing", "on_hold"]}}},
        {"$group": {
            "_id": None,
            "count": {"$sum": 1},
            "avg_sentiment": {"$avg": "$ai_summary.overall_sentiment"},
            "max_duration": {"$max": "$duration_seconds"},
            "avg_health": {"$avg": "$health_score"},
        }}
    ]
    agg_result = await db.calls.aggregate(pipeline).to_list(1)
    active_data = agg_result[0] if agg_result else {"count": 0, "avg_sentiment": 0, "max_duration": 0, "avg_health": 50}

    # Single aggregation for today's call counts
    today_pipeline = [
        {"$match": {"started_at": {"$gte": today_start}}},
        {"$facet": {
            "total": [{"$count": "n"}],
            "ended": [{"$match": {"status": "ended"}}, {"$count": "n"}],
        }}
    ]
    today_result = await db.calls.aggregate(today_pipeline).to_list(1)
    today_data = today_result[0] if today_result else {"total": [], "ended": []}
    total_today = today_data["total"][0]["n"] if today_data["total"] else 0
    ended_today = today_data["ended"][0]["n"] if today_data["ended"] else 0

    alert_count = await db.alerts.count_documents({"status": "active"})

    return {
        "active_calls": active_data["count"],
        "avg_sentiment": round(active_data["avg_sentiment"] or 0, 2),
        "alerts_count": alert_count,
        "longest_call": active_data["max_duration"] or 0,
        "total_calls_today": total_today,
        "resolved_today": ended_today,
        "avg_health_score": round(active_data["avg_health"] or 50, 1),
    }


@api_router.get("/analytics/hourly")
async def get_hourly_analytics(request: Request):
    await get_current_user(request)
    now = datetime.now(timezone.utc)
    hours = []
    for i in range(24):
        hour_start = now.replace(hour=i, minute=0, second=0, microsecond=0)
        hour_end = hour_start + timedelta(hours=1)
        if hour_start > now:
            break
        count = await db.calls.count_documents({
            "started_at": {"$gte": hour_start.isoformat(), "$lt": hour_end.isoformat()}
        })
        calls_in_hour = await db.calls.find(
            {"started_at": {"$gte": hour_start.isoformat(), "$lt": hour_end.isoformat()}},
            {"_id": 0, "ai_summary.overall_sentiment": 1}
        ).to_list(200)
        sents = [c.get("ai_summary", {}).get("overall_sentiment", 0) for c in calls_in_hour]
        avg_s = sum(sents) / len(sents) if sents else 0
        hours.append({"hour": i, "calls": count, "avg_sentiment": round(avg_s, 2)})
    return hours


@api_router.get("/analytics/agents")
async def get_agent_analytics(request: Request):
    await get_current_user(request)
    agents = await db.agents.find({}, {"_id": 0}).to_list(50)
    return agents


@api_router.get("/analytics/issues")
async def get_issue_analytics(request: Request):
    await get_current_user(request)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    calls = await db.calls.find(
        {"started_at": {"$gte": today_start}},
        {"_id": 0, "ai_summary.primary_issue": 1, "ai_summary.risk_level": 1}
    ).to_list(500)

    issues = {}
    for c in calls:
        issue = c.get("ai_summary", {}).get("primary_issue", "Unknown")
        issues[issue] = issues.get(issue, 0) + 1
    return [{"issue": k, "count": v} for k, v in sorted(issues.items(), key=lambda x: -x[1])]


@api_router.post("/analytics/export")
async def export_analytics(request: Request):
    await get_current_user(request)
    calls = await db.calls.find(
        {"status": "ended"},
        {"_id": 0, "transcript": 0, "_scenario": 0, "_message_index": 0, "_last_message_time": 0, "_created_at": 0}
    ).sort("ended_at", -1).limit(500).to_list(500)
    return {"export_data": calls, "exported_at": datetime.now(timezone.utc).isoformat(), "count": len(calls)}


# ─── Simulation Endpoints ───
@api_router.post("/simulation/start")
async def start_simulation(request: Request):
    await get_current_user(request)
    global simulation
    if simulation and simulation.running:
        return {"message": "Simulation already running"}
    simulation = SimulationEngine(db, ws_manager.broadcast)
    await simulation.start()
    return {"message": "Simulation started"}


@api_router.post("/simulation/stop")
async def stop_simulation(request: Request):
    await get_current_user(request)
    global simulation
    if simulation:
        await simulation.stop()
    return {"message": "Simulation stopped"}


@api_router.post("/simulation/config")
async def update_simulation_config(config: SimulationConfig, request: Request):
    await get_current_user(request)
    global simulation
    if not simulation:
        return {"message": "Simulation not running"}
    update = {k: v for k, v in config.model_dump().items() if v is not None}
    await simulation.update_config(update)
    return {"message": "Config updated", "config": simulation.config}


@api_router.post("/simulation/trigger-event")
async def trigger_simulation_event(event: TriggerEvent, request: Request):
    await get_current_user(request)
    global simulation
    if not simulation or not simulation.running:
        return {"message": "Simulation not running"}
    success = await simulation.trigger_event(event.event_type)
    if success:
        return {"message": f"Event '{event.event_type}' triggered"}
    raise HTTPException(status_code=400, detail=f"Unknown event type: {event.event_type}")


@api_router.get("/simulation/status")
async def get_simulation_status(request: Request):
    await get_current_user(request)
    global simulation
    if simulation:
        return {"running": simulation.running, "config": simulation.config, "active_calls": len(simulation.active_calls)}
    return {"running": False, "config": {}, "active_calls": 0}


# ─── WebSocket Endpoints ───
@app.websocket("/api/ws/live")
async def websocket_live(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Client can send ping/pong or commands
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


# ─── Startup / Shutdown ───
@app.on_event("startup")
async def startup():
    global simulation
    logger.info("Starting application...")
    # Clean old simulation data
    await db.calls.delete_many(
        {"status": {"$in": ["active", "ringing", "on_hold", "wrapping_up"]}}
    )
    await db.alerts.delete_many({"status": "active"})
    # Start simulation automatically
    simulation = SimulationEngine(db, ws_manager.broadcast)
    await simulation.start()
    logger.info("Simulation auto-started")


@app.on_event("shutdown")
async def shutdown():
    global simulation
    if simulation:
        await simulation.stop()
    client.close()


# ─── Include Router & CORS ───
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
