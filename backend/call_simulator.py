import random
import asyncio
import uuid
import logging
from datetime import datetime, timezone
from ai_engine import analyze_message, summarize_call_llm, generate_fallback_summary

logger = logging.getLogger(__name__)

AGENT_PROFILES = [
    {"agent_id": "AGT-001", "name": "Sarah Mitchell", "skills": ["billing", "retention", "technical"], "avatar_idx": 0},
    {"agent_id": "AGT-002", "name": "Michael Torres", "skills": ["technical", "billing"], "avatar_idx": 1},
    {"agent_id": "AGT-003", "name": "Lisa Kim", "skills": ["retention", "sales", "billing"], "avatar_idx": 2},
    {"agent_id": "AGT-004", "name": "James Parker", "skills": ["technical", "escalation"], "avatar_idx": 3},
    {"agent_id": "AGT-005", "name": "Anna Chen", "skills": ["billing", "sales"], "avatar_idx": 4},
    {"agent_id": "AGT-006", "name": "David Robinson", "skills": ["technical", "retention"], "avatar_idx": 0},
    {"agent_id": "AGT-007", "name": "Emily Patel", "skills": ["sales", "billing", "retention"], "avatar_idx": 1},
    {"agent_id": "AGT-008", "name": "Chris Williams", "skills": ["escalation", "technical", "billing"], "avatar_idx": 2},
]

CUSTOMER_NAMES = [
    "John Davis", "Maria Garcia", "Robert Wilson", "Jennifer Lee",
    "Thomas Brown", "Amanda Martinez", "Kevin Johnson", "Stephanie Smith",
    "Daniel Anderson", "Rachel Thompson", "William Clark", "Nicole Harris",
    "Jason Wright", "Lauren Mitchell", "Andrew Scott", "Megan Young",
    "Christopher King", "Ashley Green", "Brandon Hall", "Samantha Allen",
]

SCENARIOS = [
    {
        "type": "billing_dispute",
        "customer_mood": "frustrated",
        "complexity": "medium",
        "messages": [
            {"speaker": "agent", "text": "Thank you for calling TechCorp Support. This is {agent}, how can I help you today?"},
            {"speaker": "customer", "text": "Hi, I need to talk about my bill. I was charged $149.99 but my plan is supposed to be $99.99."},
            {"speaker": "agent", "text": "I understand your concern, {customer}. Let me pull up your account right away."},
            {"speaker": "customer", "text": "This is the second time this has happened. I called last month about the same exact issue."},
            {"speaker": "agent", "text": "I apologize for the recurring issue. I can see there was an upgrade fee applied to your account."},
            {"speaker": "customer", "text": "I never authorized any upgrade! This is ridiculous. I've been a loyal customer for 3 years."},
            {"speaker": "agent", "text": "I completely understand your frustration, and I want to make this right. Let me reverse that charge immediately."},
            {"speaker": "customer", "text": "And what about last month's overcharge? That was never properly refunded either."},
            {"speaker": "agent", "text": "Let me check. I see the credit was initiated but didn't process correctly. I'll reissue both credits now."},
            {"speaker": "customer", "text": "If this happens again, I'm switching to your competitor. I mean it."},
            {"speaker": "agent", "text": "I'm processing a $100 credit for this month and $50 for last month. You'll see it within 3-5 business days."},
            {"speaker": "customer", "text": "Fine. I appreciate you handling this, but I shouldn't have to call every month."},
            {"speaker": "agent", "text": "You're absolutely right. I've flagged your account to prevent future automatic upgrades. Anything else?"},
            {"speaker": "customer", "text": "No, that should be it. Thank you."},
            {"speaker": "agent", "text": "Thank you for your patience, {customer}. Have a great day."},
        ]
    },
    {
        "type": "technical_issue",
        "customer_mood": "confused",
        "complexity": "high",
        "messages": [
            {"speaker": "agent", "text": "TechCorp Support, this is {agent}. What can I help you with?"},
            {"speaker": "customer", "text": "Hey, my internet has been down since this morning. Nothing is working."},
            {"speaker": "agent", "text": "I'm sorry to hear that, {customer}. Have you tried restarting your router?"},
            {"speaker": "customer", "text": "Yes, I've restarted it three times already. The lights just keep blinking orange."},
            {"speaker": "agent", "text": "I see. Let me run a diagnostic on your connection from our end."},
            {"speaker": "customer", "text": "I work from home and I have an important meeting in 30 minutes. I really need this fixed now."},
            {"speaker": "agent", "text": "I understand the urgency. The diagnostic shows there might be a signal issue at your location."},
            {"speaker": "customer", "text": "What does that mean? Is there an outage in my area?"},
            {"speaker": "agent", "text": "There's no area-wide outage, but I can see some signal degradation. Let me try a remote reset of your equipment."},
            {"speaker": "customer", "text": "Okay, please hurry. This is really stressful."},
            {"speaker": "agent", "text": "The reset is in progress. It should take about 2 minutes. Are you seeing any changes on the router?"},
            {"speaker": "customer", "text": "Oh wait, the light just turned green! Let me check... yes, the internet is back!"},
            {"speaker": "agent", "text": "Excellent! I'm glad we could resolve that quickly. Is the speed looking normal?"},
            {"speaker": "customer", "text": "Yes, everything seems to be working now. Thank you so much for the quick help!"},
            {"speaker": "agent", "text": "You're welcome! If you experience any more issues, don't hesitate to call. Good luck with your meeting!"},
        ]
    },
    {
        "type": "cancellation_request",
        "customer_mood": "angry",
        "complexity": "high",
        "messages": [
            {"speaker": "agent", "text": "Thank you for calling TechCorp. I'm {agent}, how can I assist you?"},
            {"speaker": "customer", "text": "I want to cancel my account. Immediately."},
            {"speaker": "agent", "text": "I'm sorry to hear that, {customer}. May I ask what's prompting this decision?"},
            {"speaker": "customer", "text": "Your service has been terrible for months. Outages every week, speeds are half what I'm paying for."},
            {"speaker": "agent", "text": "I understand your frustration with the service quality. Let me look into what's been happening with your account."},
            {"speaker": "customer", "text": "Don't bother trying to talk me out of it. I've already signed up with your competitor. Just cancel it."},
            {"speaker": "agent", "text": "I respect your decision. Before I process the cancellation, I want to mention we have a new premium tier that addresses the speed issues."},
            {"speaker": "customer", "text": "I don't care about new tiers. You've had months to fix this and didn't. Cancel my account right now."},
            {"speaker": "agent", "text": "I understand. I can offer you 3 months free as we've recently upgraded our infrastructure in your area."},
            {"speaker": "customer", "text": "Three months free? After the terrible service I've had? That's insulting. Just process the cancellation."},
            {"speaker": "agent", "text": "I apologize if that seemed inadequate. I'll process the cancellation right away. Your final bill will be prorated."},
            {"speaker": "customer", "text": "I also want a refund for the last two months of service since it was barely usable."},
            {"speaker": "agent", "text": "I'll submit a refund request for the last two months. It will be reviewed by our billing team within 48 hours."},
            {"speaker": "customer", "text": "Fine. Make sure it actually gets processed. I'm done dealing with this company."},
            {"speaker": "agent", "text": "Your cancellation is processed and the refund request is submitted. You'll receive a confirmation email shortly."},
        ]
    },
    {
        "type": "product_inquiry",
        "customer_mood": "pleasant",
        "complexity": "low",
        "messages": [
            {"speaker": "agent", "text": "Welcome to TechCorp Sales, this is {agent}. How can I help you today?"},
            {"speaker": "customer", "text": "Hi! I'm interested in upgrading my current plan. Can you tell me about your premium package?"},
            {"speaker": "agent", "text": "Of course! Our premium package includes 500 Mbps speeds, unlimited data, and priority support. It's $89.99 per month."},
            {"speaker": "customer", "text": "That sounds good. What's the difference between premium and the enterprise plan?"},
            {"speaker": "agent", "text": "The enterprise plan adds 1 Gbps speeds, a dedicated account manager, and 99.99% uptime SLA for $149.99 per month."},
            {"speaker": "customer", "text": "I think premium would be enough for me. Are there any current promotions?"},
            {"speaker": "agent", "text": "Great timing! We're running a promotion where new premium subscribers get the first 3 months at $69.99."},
            {"speaker": "customer", "text": "That's a great deal! Can I keep my current phone number if I switch?"},
            {"speaker": "agent", "text": "Absolutely, your number will be transferred automatically. The switch takes about 24 hours."},
            {"speaker": "customer", "text": "Perfect. Let's go ahead with the premium plan then!"},
            {"speaker": "agent", "text": "Wonderful! I'll get that set up for you right now. You'll receive a confirmation email within the hour."},
            {"speaker": "customer", "text": "Excellent, thank you so much for your help!"},
            {"speaker": "agent", "text": "My pleasure, {customer}! Welcome to TechCorp Premium. Have a wonderful day!"},
        ]
    },
    {
        "type": "service_outage",
        "customer_mood": "anxious",
        "complexity": "medium",
        "messages": [
            {"speaker": "agent", "text": "TechCorp Support, {agent} speaking. How can I help?"},
            {"speaker": "customer", "text": "Is there a service outage right now? My entire office network is down and we can't do anything."},
            {"speaker": "agent", "text": "Let me check our system status for your area, {customer}. What's your zip code?"},
            {"speaker": "customer", "text": "It's 90210. We have 50 employees who can't work right now. This is costing us thousands per hour."},
            {"speaker": "agent", "text": "I can see there is a confirmed outage in your area affecting business customers. Our team is already working on it."},
            {"speaker": "customer", "text": "When will it be fixed? We have critical deadlines today."},
            {"speaker": "agent", "text": "The estimated time to resolution is 2 hours. I know that's not ideal given your situation."},
            {"speaker": "customer", "text": "Two hours?! That's unacceptable. We're losing money every minute this is down."},
            {"speaker": "agent", "text": "I completely understand the impact. Let me escalate this to our priority repair team and see if we can expedite."},
            {"speaker": "customer", "text": "Please do. And I want to be notified the moment it's back up. Can I get a direct number?"},
            {"speaker": "agent", "text": "I'll set up automatic SMS notifications for you. I'm also issuing a service credit to your account for the downtime."},
            {"speaker": "customer", "text": "A credit is the least you can do. This outage is going to be very costly for us."},
            {"speaker": "agent", "text": "I'll make sure our account manager follows up with you about additional compensation. You'll get the first SMS update within 30 minutes."},
            {"speaker": "customer", "text": "Alright. Please make this a priority."},
            {"speaker": "agent", "text": "It is our top priority. I'll personally follow up with you once service is restored."},
        ]
    },
    {
        "type": "refund_request",
        "customer_mood": "disappointed",
        "complexity": "medium",
        "messages": [
            {"speaker": "agent", "text": "Thank you for calling TechCorp, this is {agent}. How can I help you?"},
            {"speaker": "customer", "text": "I'd like to request a refund for my equipment purchase. The router I bought doesn't work properly."},
            {"speaker": "agent", "text": "I'm sorry to hear that, {customer}. When did you purchase the router?"},
            {"speaker": "customer", "text": "About two weeks ago. It drops connection every few hours and the range is terrible."},
            {"speaker": "agent", "text": "That's within our 30-day return window. Have you tried the troubleshooting steps in the manual?"},
            {"speaker": "customer", "text": "Yes, I've tried everything. Factory reset, different channels, firmware update. Nothing works."},
            {"speaker": "agent", "text": "It sounds like you've been very thorough. I can process a full refund of $129.99 for you."},
            {"speaker": "customer", "text": "Great. How long will that take? And do I need to return the defective router?"},
            {"speaker": "agent", "text": "The refund takes 5-7 business days. We'll send you a prepaid shipping label for the return."},
            {"speaker": "customer", "text": "Okay, that works. Can you also recommend a better router that actually works?"},
            {"speaker": "agent", "text": "Our Pro Router has much better range and reliability. It's $179.99 but I can apply a 20% loyalty discount."},
            {"speaker": "customer", "text": "That sounds reasonable. Let me think about it and I'll order online if I decide to."},
            {"speaker": "agent", "text": "Of course! Your refund is being processed and you'll receive the shipping label via email today."},
        ]
    },
    {
        "type": "account_security",
        "customer_mood": "panicked",
        "complexity": "high",
        "messages": [
            {"speaker": "agent", "text": "TechCorp Security Team, {agent} here. How can I help you?"},
            {"speaker": "customer", "text": "I think someone hacked my account! I got an email about a $500 purchase I never made!"},
            {"speaker": "agent", "text": "I understand how alarming that must be, {customer}. Let me secure your account right away."},
            {"speaker": "customer", "text": "Please hurry! I'm worried they'll charge more. This is my business account with sensitive data."},
            {"speaker": "agent", "text": "I've placed a temporary hold on all transactions. Can you verify your identity with your security PIN?"},
            {"speaker": "customer", "text": "Yes, it's 7842. Please tell me what happened. When was the unauthorized access?"},
            {"speaker": "agent", "text": "I can see a login from an unrecognized device at 3:47 AM this morning. The $500 charge was for equipment."},
            {"speaker": "customer", "text": "That wasn't me at all. I was asleep at 3 AM. Can you reverse that charge?"},
            {"speaker": "agent", "text": "Absolutely. I'm reversing the charge now and I've changed your password. You'll need to set a new one."},
            {"speaker": "customer", "text": "Okay. Is my data safe? Should I be worried about identity theft?"},
            {"speaker": "agent", "text": "I've checked and no personal data was accessed. I recommend enabling two-factor authentication for extra security."},
            {"speaker": "customer", "text": "Yes, please set that up for me. I don't want this happening again."},
            {"speaker": "agent", "text": "Two-factor is now enabled. You'll get a text code with each login. The unauthorized charge has been fully reversed."},
            {"speaker": "customer", "text": "Thank you so much. You've been incredibly helpful. I was really worried."},
            {"speaker": "agent", "text": "I'm glad I could help. If you notice anything suspicious, call our security line directly anytime."},
        ]
    },
    {
        "type": "shipping_issue",
        "customer_mood": "worried",
        "complexity": "low",
        "messages": [
            {"speaker": "agent", "text": "TechCorp Support, {agent} speaking. What can I help you with?"},
            {"speaker": "customer", "text": "I ordered a new modem 10 days ago and it still hasn't arrived. The tracking says it's stuck in transit."},
            {"speaker": "agent", "text": "Let me look into that for you, {customer}. What's your order number?"},
            {"speaker": "customer", "text": "It's ORD-2024-78542. I really need it because my current one is barely working."},
            {"speaker": "agent", "text": "I found your order. It appears there was a shipping delay due to weather in the distribution center."},
            {"speaker": "customer", "text": "Weather? It's been 10 days though. When will I actually get it?"},
            {"speaker": "agent", "text": "The latest update shows it should arrive within the next 2 business days. I apologize for the delay."},
            {"speaker": "customer", "text": "That's frustrating. I've been dealing with a terrible connection while waiting for this replacement."},
            {"speaker": "agent", "text": "I completely understand. Let me expedite the shipping at no extra cost and apply a $25 credit to your account."},
            {"speaker": "customer", "text": "Okay, that helps a little. Will I get an updated tracking number?"},
            {"speaker": "agent", "text": "Yes, you'll receive a new tracking email within the hour. The expedited delivery should arrive by tomorrow."},
            {"speaker": "customer", "text": "Alright, thank you for handling this. I hope it actually arrives this time."},
            {"speaker": "agent", "text": "I've set a delivery alert for myself as well. I'll follow up if there are any more issues. Have a good day!"},
        ]
    },
]

# Special trigger scenarios for demo
TRIGGER_SCENARIOS = {
    "angry_customer": {
        "type": "angry_customer",
        "customer_mood": "furious",
        "complexity": "critical",
        "messages": [
            {"speaker": "agent", "text": "TechCorp Support, {agent} speaking."},
            {"speaker": "customer", "text": "I am absolutely furious right now! I've been a customer for 5 years and this is the worst service I've ever experienced!"},
            {"speaker": "agent", "text": "I'm very sorry to hear that, {customer}. Please tell me what happened."},
            {"speaker": "customer", "text": "You charged me $300 for services I never ordered, my internet has been down for 3 days, and nobody has called me back despite 4 complaints!"},
            {"speaker": "agent", "text": "That's completely unacceptable and I sincerely apologize. Let me escalate this to our resolution team."},
            {"speaker": "customer", "text": "I'm done with escalations! I want to speak to a manager RIGHT NOW or I'm canceling everything and going to your competitor!"},
            {"speaker": "agent", "text": "I understand your frustration. Let me connect you with my supervisor immediately."},
            {"speaker": "customer", "text": "This is the last chance. If this isn't resolved today, I'm filing a complaint with the BBB and switching providers."},
            {"speaker": "agent", "text": "I hear you and I'm making this our highest priority. My supervisor will be on the line within 60 seconds."},
        ]
    },
    "escalation_request": {
        "type": "escalation_request",
        "customer_mood": "demanding",
        "complexity": "high",
        "messages": [
            {"speaker": "agent", "text": "TechCorp Support, this is {agent}."},
            {"speaker": "customer", "text": "Hi, I need to speak with a supervisor. The agent I spoke to yesterday promised me a callback that never happened."},
            {"speaker": "agent", "text": "I apologize for that, {customer}. Let me review what happened."},
            {"speaker": "customer", "text": "I don't want another review. I want a supervisor. I've been given the runaround for a week now."},
            {"speaker": "agent", "text": "I completely understand. Let me get my supervisor on the line."},
            {"speaker": "customer", "text": "Thank you. And please make sure it's someone who can actually make decisions. I need this resolved today."},
        ]
    },
    "compliance_issue": {
        "type": "compliance_issue",
        "customer_mood": "threatening",
        "complexity": "critical",
        "messages": [
            {"speaker": "agent", "text": "TechCorp Support, {agent} here."},
            {"speaker": "customer", "text": "I'm recording this call. I've discovered you've been charging my account without authorization for 6 months."},
            {"speaker": "agent", "text": "I take this very seriously, {customer}. Let me investigate immediately."},
            {"speaker": "customer", "text": "I've already consulted with my attorney. If this isn't resolved and fully refunded, I will be filing a lawsuit."},
            {"speaker": "agent", "text": "I understand the severity. Let me connect you with our compliance department right away."},
            {"speaker": "customer", "text": "I also plan to report this to the Better Business Bureau and the FTC. This is fraud, plain and simple."},
            {"speaker": "agent", "text": "I'm transferring you to our legal compliance team now. They have the authority to handle this."},
        ]
    }
}


class SimulationEngine:
    def __init__(self, db, broadcast_fn):
        self.db = db
        self.broadcast = broadcast_fn
        self.running = False
        self.config = {
            "num_calls": 12,
            "issue_frequency": 0.3,
            "sentiment_distribution": "normal",
            "message_interval": 4,
        }
        self.active_calls = {}
        self.call_counter = 0
        self._task = None

    async def start(self):
        if self.running:
            return
        self.running = True
        await self._seed_agents()
        for _ in range(self.config["num_calls"]):
            await self._create_call()
            await asyncio.sleep(random.uniform(0.2, 0.5))
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"Simulation started with {self.config['num_calls']} calls")

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            self._task = None
        logger.info("Simulation stopped")

    async def update_config(self, new_config):
        self.config.update(new_config)
        target = self.config["num_calls"]
        current = len(self.active_calls)
        if current < target:
            for _ in range(target - current):
                await self._create_call()
        elif current > target:
            calls_to_end = list(self.active_calls.keys())[:current - target]
            for cid in calls_to_end:
                await self._end_call(cid)

    async def trigger_event(self, event_type):
        scenario = TRIGGER_SCENARIOS.get(event_type)
        if scenario:
            await self._create_call(scenario=scenario)
            return True
        return False

    async def _seed_agents(self):
        for agent in AGENT_PROFILES:
            existing = await self.db.agents.find_one({"agent_id": agent["agent_id"]}, {"_id": 0})
            if not existing:
                now = datetime.now(timezone.utc).isoformat()
                await self.db.agents.insert_one({
                    "agent_id": agent["agent_id"],
                    "name": agent["name"],
                    "skills": agent["skills"],
                    "avatar_idx": agent["avatar_idx"],
                    "status": "available",
                    "current_call_id": None,
                    "shift": {"start": now, "end": now, "breaks_taken": 0},
                    "performance_today": {
                        "calls_handled": random.randint(5, 20),
                        "avg_handle_time": round(random.uniform(180, 420), 1),
                        "avg_sentiment": round(random.uniform(-0.1, 0.6), 2),
                        "escalation_rate": round(random.uniform(0.02, 0.15), 2),
                        "resolution_rate": round(random.uniform(0.7, 0.95), 2),
                    },
                    "performance_monthly": {
                        "calls_handled": random.randint(200, 500),
                        "avg_handle_time": round(random.uniform(200, 400), 1),
                        "customer_satisfaction_avg": round(random.uniform(3.5, 4.8), 1),
                        "quality_score": round(random.uniform(70, 98), 1),
                    }
                })

    async def _create_call(self, scenario=None):
        self.call_counter += 1
        call_id = f"CALL-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        if scenario is None:
            scenario = random.choice(SCENARIOS)

        agent_profile = random.choice(AGENT_PROFILES)
        customer_name = random.choice(CUSTOMER_NAMES)
        now = datetime.now(timezone.utc).isoformat()

        call_doc = {
            "call_id": call_id,
            "status": "active",
            "channel": "voice",
            "started_at": now,
            "ended_at": None,
            "duration_seconds": 0,
            "customer": {
                "id": f"CUST-{uuid.uuid4().hex[:8]}",
                "name": customer_name,
                "phone": f"+1-555-{random.randint(100,999)}-{random.randint(1000,9999)}",
                "account_type": random.choice(["premium", "standard", "new"]),
                "lifetime_value": round(random.uniform(500, 10000), 2),
                "previous_calls_count": random.randint(0, 15),
                "last_issue": random.choice(["billing", "technical", "none", "shipping"]),
            },
            "agent": {
                "id": agent_profile["agent_id"],
                "name": agent_profile["name"],
                "skills": agent_profile["skills"],
            },
            "transcript": [],
            "ai_summary": {
                "overall_sentiment": 0.0,
                "sentiment_trend": "stable",
                "primary_issue": scenario["type"].replace("_", " ").title(),
                "topics_discussed": [scenario["type"]],
                "risk_level": "low",
                "churn_probability": 0.1,
                "recommended_actions": [],
            },
            "health_score": 80,
            "alerts_triggered": [],
            "supervisor_actions": [],
            "resolution": None,
            "_scenario": scenario,
            "_message_index": 0,
            "_last_message_time": now,
            "_created_at": now,
        }

        result = await self.db.calls.insert_one(call_doc)
        await self.db.agents.update_one(
            {"agent_id": agent_profile["agent_id"]},
            {"$set": {"status": "on_call", "current_call_id": call_id}}
        )

        self.active_calls[call_id] = {
            "scenario": scenario,
            "message_index": 0,
            "agent_name": agent_profile["name"],
            "customer_name": customer_name,
            "started_at": datetime.now(timezone.utc),
            "agent_id": agent_profile["agent_id"],
        }

        # Exclude MongoDB _id and internal fields from broadcast
        broadcast_doc = {
            "call_id": call_doc["call_id"],
            "status": call_doc["status"],
            "channel": call_doc["channel"],
            "started_at": call_doc["started_at"],
            "customer": call_doc["customer"],
            "agent": call_doc["agent"],
            "health_score": call_doc["health_score"],
            "ai_summary": call_doc["ai_summary"],
            "duration_seconds": 0,
            "transcript": [],
            "alerts_triggered": [],
        }
        await self.broadcast({"type": "call_started", "data": broadcast_doc})

    async def _end_call(self, call_id):
        if call_id not in self.active_calls:
            return
        call_state = self.active_calls.pop(call_id)
        now = datetime.now(timezone.utc)
        duration = int((now - call_state["started_at"]).total_seconds())

        call_doc = await self.db.calls.find_one({"call_id": call_id}, {"_id": 0})
        transcript = call_doc.get("transcript", []) if call_doc else []
        summary = generate_fallback_summary(transcript)

        resolution_type = random.choice(["solved", "escalated", "callback_scheduled"])
        satisfaction = random.randint(1, 5) if resolution_type == "solved" else random.randint(1, 3)

        await self.db.calls.update_one(
            {"call_id": call_id},
            {"$set": {
                "status": "ended",
                "ended_at": now.isoformat(),
                "duration_seconds": duration,
                "ai_summary": summary,
                "resolution": {
                    "resolved": resolution_type == "solved",
                    "resolution_type": resolution_type,
                    "customer_satisfaction": satisfaction
                }
            }}
        )
        await self.db.agents.update_one(
            {"agent_id": call_state["agent_id"]},
            {"$set": {"status": "available", "current_call_id": None}}
        )

        await self.broadcast({"type": "call_ended", "data": {"call_id": call_id, "duration": duration}})

    async def _run_loop(self):
        logger.info("Simulation loop starting...")
        try:
            while self.running:
                call_ids = list(self.active_calls.keys())
                for call_id in call_ids:
                    if not self.running:
                        break
                    try:
                        await self._progress_call(call_id)
                    except Exception as e:
                        logger.error(f"Error progressing call {call_id}: {e}", exc_info=True)

                # Replace ended calls
                while len(self.active_calls) < self.config["num_calls"] and self.running:
                    try:
                        await self._create_call()
                    except Exception as e:
                        logger.error(f"Error creating call: {e}", exc_info=True)
                    await asyncio.sleep(0.3)

                # Broadcast metrics
                try:
                    await self._broadcast_metrics()
                except Exception as e:
                    logger.error(f"Error broadcasting metrics: {e}")
                await asyncio.sleep(self.config.get("message_interval", 4))
        except asyncio.CancelledError:
            logger.info("Simulation loop cancelled")
        except Exception as e:
            logger.error(f"Simulation loop fatal error: {e}", exc_info=True)

    async def _progress_call(self, call_id):
        if call_id not in self.active_calls:
            return
        state = self.active_calls[call_id]
        scenario = state["scenario"]
        messages = scenario["messages"]
        idx = state["message_index"]

        if idx >= len(messages):
            await self._end_call(call_id)
            return

        msg_template = messages[idx]
        text = msg_template["text"].replace("{agent}", state["agent_name"]).replace("{customer}", state["customer_name"])
        speaker = msg_template["speaker"]

        analysis = analyze_message(text, speaker)
        now = datetime.now(timezone.utc)

        transcript_entry = {
            "speaker": speaker,
            "text": text,
            "timestamp": now.isoformat(),
            "analysis": analysis,
        }

        duration = int((now - state["started_at"]).total_seconds())
        sentiments = []
        call_doc = await self.db.calls.find_one({"call_id": call_id}, {"_id": 0, "transcript": 1})
        if call_doc and call_doc.get("transcript"):
            sentiments = [m["analysis"]["sentiment"] for m in call_doc["transcript"] if m.get("analysis")]
        sentiments.append(analysis["sentiment"])
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
        health = max(0, min(100, int(50 + avg_sentiment * 50)))

        await self.db.calls.update_one(
            {"call_id": call_id, "status": "active"},
            {
                "$push": {"transcript": transcript_entry},
                "$set": {
                    "duration_seconds": duration,
                    "health_score": health,
                    "ai_summary.overall_sentiment": round(avg_sentiment, 2),
                }
            }
        )

        state["message_index"] = idx + 1

        # Check for alerts
        for flag in analysis.get("flags", []):
            await self._create_alert(call_id, flag, text, analysis["sentiment"], state)

        await self.broadcast({
            "type": "call_update",
            "data": {
                "call_id": call_id,
                "transcript_entry": transcript_entry,
                "health_score": health,
                "avg_sentiment": round(avg_sentiment, 2),
                "duration_seconds": duration,
            }
        })

    async def _create_alert(self, call_id, flag_type, trigger_phrase, sentiment, state):
        alert_map = {
            "churn_risk": ("Churn Risk Detected", "critical", "negative_sentiment"),
            "escalation_needed": ("Escalation Request", "warning", "escalation_request"),
            "compliance_risk": ("Compliance Risk", "critical", "compliance"),
            "profanity": ("Profanity Detected", "warning", "agent_issue"),
        }
        title, severity, alert_type = alert_map.get(flag_type, ("Issue Detected", "info", "agent_issue"))

        alert_doc = {
            "alert_id": f"ALT-{uuid.uuid4().hex[:8]}",
            "call_id": call_id,
            "alert_type": alert_type,
            "severity": severity,
            "title": title,
            "message": f"{title} - {call_id} ({state['customer_name']})",
            "details": {
                "trigger_phrase": trigger_phrase[:100],
                "sentiment_score": sentiment,
                "context": f"Customer: {state['customer_name']}, Agent: {state['agent_name']}",
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "active",
            "acknowledged_by": None,
            "acknowledged_at": None,
            "resolution_notes": None,
        }
        await self.db.alerts.insert_one(alert_doc)
        await self.db.calls.update_one(
            {"call_id": call_id},
            {"$push": {"alerts_triggered": {
                "alert_type": alert_type,
                "severity": severity,
                "message": alert_doc["message"],
                "triggered_at": alert_doc["created_at"],
                "acknowledged": False,
            }}}
        )
        safe_alert = {k: v for k, v in alert_doc.items() if k != "_id"}
        await self.broadcast({"type": "alert_new", "data": safe_alert})

    async def _broadcast_metrics(self):
        active_count = len(self.active_calls)
        all_calls = await self.db.calls.find(
            {"status": "active"}, {"_id": 0, "health_score": 1, "ai_summary.overall_sentiment": 1, "duration_seconds": 1}
        ).to_list(100)

        sentiments = [c.get("ai_summary", {}).get("overall_sentiment", 0) for c in all_calls]
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
        durations = [c.get("duration_seconds", 0) for c in all_calls]
        max_duration = max(durations) if durations else 0

        active_alerts = await self.db.alerts.count_documents({"status": "active"})

        await self.broadcast({
            "type": "metrics_update",
            "data": {
                "active_calls": active_count,
                "avg_sentiment": round(avg_sentiment, 2),
                "alerts_count": active_alerts,
                "longest_call": max_duration,
            }
        })
