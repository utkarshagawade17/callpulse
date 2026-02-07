# CallPulse — Real-Time Contact Center Voice Analytics Platform

> AI-powered supervisor dashboard for monitoring live voice calls with real-time transcription, sentiment tracking, intelligent alerting, and agent performance analytics.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-CallPulse-00C7B7?style=for-the-badge)](https://utkarshagawade-callpulse.deployed.emergentagent.com)
[![Built With](https://img.shields.io/badge/Built%20With-FastAPI%20%2B%20React%20%2B%20MongoDB-3B82F6?style=for-the-badge)]()
[![AI Powered](https://img.shields.io/badge/AI-OpenAI%20GPT--5.2-10B981?style=for-the-badge)]()

---
## Screenshots

### Login & Authentication
<img width="1423" alt="CallPulse Login" src="https://github.com/user-attachments/assets/b44f7b05-8391-46dd-b76c-c6180eb36714" />

*Supervisor login with Google OAuth — dark command-center theme*

<img width="1278" alt="Google OAuth" src="https://github.com/user-attachments/assets/cae42815-e26b-494b-8fd8-0d714b8e7040" />

*Google sign-in flow for secure supervisor authentication*

---

### Live Monitor Dashboard
<img width="1461" alt="Dashboard" src="https://github.com/user-attachments/assets/e42b53f0-173d-4ec8-9012-3d09280bbbec" />

*Real-time dashboard with KPIs, alert banners, and active call grid*

<img width="720" alt="Dashboard KPIs" src="https://github.com/user-attachments/assets/5b0561b7-b214-4ac9-995f-2f2c73799aa4" />

*Live call cards showing agent, customer, transcript preview, and sentiment scores*

---

### Call Deep-Dive
*Full transcript view with live sentiment chart, AI insights, and supervisor actions*
<img width="1458" alt="Call Details" src="https://github.com/user-attachments/assets/16949f64-49d3-4dc7-b697-2d1c941b0c67" />
*Call card with "View Details" action and sentiment indicator*

<img width="305" alt="Supervisor Actions" src="https://github.com/user-attachments/assets/4cd7ef07-def2-4923-9401-34a1bae98f3d" />

<img width="735" alt="Call Card Hover" src="https://github.com/user-attachments/assets/e4e45e5b-7412-463c-9d3b-be8dc4227490" />


---

### AI Insights & Actions
*Flag, transfer, and add notes to any active call*

<img width="407" alt="Sentiment Chart" src="https://github.com/user-attachments/assets/d39fb51f-a326-4279-83a8-34f53bf72fda" />

*Real-time sentiment chart tracking emotional arc of conversation*

<img width="428" alt="Alert Types" src="https://github.com/user-attachments/assets/fea8d38b-1dda-4da1-b6dd-e5f5536ab94a" />



---

### Alerts Panel

*AI-detected alerts: churn risk, escalation requests, compliance issues*
*Critical and warning alerts with acknowledge/resolve actions*

<img width="736" alt="Analytics Charts" src="https://github.com/user-attachments/assets/63aa7d6f-1ca2-42fd-a906-a1be745607e6" />


*Critical and warning alerts with acknowledge/resolve actions*

---

### Analytics Dashboard
<img width="1445" alt="Alerts" src="https://github.com/user-attachments/assets/0778c9fd-754a-4048-b44a-ba580d788474" />

*Call volume, sentiment trends, issue distribution, and agent performance charts*
*Hourly call patterns and agent leaderboard*

<img width="735" alt="Simulation" src="https://github.com/user-attachments/assets/c638b59f-6834-47c1-a65d-a03d695405b6" />


---

### Simulation Controls
*Configure call engine and trigger demo scenarios (angry customer, escalation, compliance)*

<img width="1466" alt="Analytics" src="https://github.com/user-attachments/assets/4285711f-dd03-4f3d-b2fa-236f1131c31a" />











---
## Overview

**CallPulse** simulates a contact center supervisor's command center — monitoring 12+ simultaneous live voice calls with AI-driven analytics. It demonstrates applied AI in an enterprise contact center context, directly relevant to Microsoft Dynamics 365 Contact Center capabilities.

A supervisor can:
- **Monitor** all active calls at a glance via a live card grid
- **Deep-dive** into any call with full transcript, sentiment timeline, and AI insights
- **Respond** to AI-generated alerts (churn risk, escalation requests, compliance violations)
- **Act** on calls — flag for review, transfer to senior agents, attach notes
- **Analyze** historical trends across call volume, sentiment, issue categories, and agent performance
- **Demo** specific scenarios on demand using the simulation control panel

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 19 · Tailwind CSS · Recharts · shadcn/ui · WebSocket │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐      │
│  │ Dashboard │ │Call Detail│ │  Alerts  │ │ Analytics │      │
│  │ (Grid)   │ │(Transcript│ │ (Manage) │ │ (Charts)  │      │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘      │
│  ┌──────────┐ ┌──────────┐                                   │
│  │  Agents  │ │Simulation│                                   │
│  │(Overview)│ │(Controls)│                                   │
│  └──────────┘ └──────────┘                                   │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API + WebSocket
┌────────────────────▼────────────────────────────────────────┐
│                        BACKEND                               │
│              FastAPI · Python · Async I/O                     │
│                                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Call Simulator │  │  AI Engine   │  │  WebSocket Mgr  │  │
│  │  (8 scenarios)  │  │ (Sentiment,  │  │  (Real-time     │  │
│  │  Background     │  │  Intent,     │  │   broadcast)    │  │
│  │  async tasks    │  │  Summarize)  │  │                 │  │
│  └────────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  21+ REST Endpoints · Auth · Calls · Alerts · Analytics │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      DATA LAYER                              │
│                                                              │
│  MongoDB (5 collections)         OpenAI GPT-5.2              │
│  ├── calls         (transcripts, ├── Call summarization      │
│  │                  sentiment)   └── On-demand analysis      │
│  ├── agents        (profiles,                                │
│  │                  performance)  Pattern-Based Engine        │
│  ├── alerts        (AI-detected)  ├── Real-time sentiment    │
│  ├── users         (supervisors)  ├── Intent classification  │
│  └── user_sessions (auth)         ├── Entity extraction      │
│                                   └── Risk flag detection    │
│  Indexed: call_id, status,                                   │
│  started_at, agent_id, email,                                │
│  session_token                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Live Call Monitoring Grid
- Real-time grid of 12+ active calls updating every 3-5 seconds
- Each card displays: agent, customer, duration, last transcript, sentiment bar, risk badge
- Cards pulse red when AI detects critical issues (negative sentiment, churn risk)
- WebSocket-powered with polling fallback for reliability

### 2. Call Deep-Dive
- Full scrolling transcript with speaker labels and timestamps
- Per-message sentiment scores, intent labels, and risk flags
- Sentiment timeline chart (Recharts) showing emotional arc of the conversation
- AI insights panel: issue classification, health score, trend direction, topics
- Supervisor action panel: flag, transfer, add notes — all logged with timestamps

### 3. AI-Powered Alert System
- Automatic detection via keyword/phrase pattern matching:
  - **Churn Risk** — "cancel my account", "switching to competitor"
  - **Escalation** — "speak to manager", "supervisor"
  - **Compliance** — "sue", "attorney", "BBB", "FTC"
  - **Profanity** — automatic flagging
- Three severity levels: Critical (red), Warning (yellow), Info (blue)
- Acknowledge/Resolve workflow with audit trail
- Alert banners on dashboard for immediate visibility

### 4. Analytics Dashboard
- **Call Volume by Hour** — bar chart with hourly breakdown
- **Sentiment Trend** — line chart tracking average sentiment over time
- **Issue Distribution** — pie chart of issue categories
- **Agent Performance** — horizontal bar chart comparing calls handled
- Summary KPIs: total calls today, resolved count, health score, active alerts
- JSON export for offline analysis

### 5. Agent Overview
- 8 agent profiles with avatar, skills, and real-time status
- Performance metrics: calls handled, avg handle time, resolution rate, quality score
- Status indicators: on call, available, wrap-up, break, offline

### 6. Simulation Controls (Demo Mode)
- Start/Stop engine toggle
- Configurable: number of active calls (3-20), message interval (2-10s)
- **Trigger buttons** for on-demand scenarios:
  - Angry Customer (furious, threatening cancellation)
  - Escalation Request (demanding manager)
  - Compliance Issue (legal threats, BBB mention)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, Tailwind CSS, shadcn/ui | Component-driven UI |
| Charts | Recharts | Analytics visualizations |
| Animations | Framer Motion, CSS animations | Pulse effects, transitions |
| State | React Context + WebSocket | Real-time global state |
| Backend | FastAPI (Python, async) | REST API + WebSocket server |
| Database | MongoDB (Motor async driver) | Document store with aggregation |
| AI - Realtime | Pattern-based engine | Sentiment, intent, entity, flags |
| AI - Summary | OpenAI GPT-5.2 | Call summarization on completion |
| Auth | Google OAuth (Emergent Auth) | Supervisor authentication |
| Fonts | Chivo, IBM Plex Sans, JetBrains Mono | Typography hierarchy |

---

## Database Design

### Collections & Indexing Strategy

```
calls           — Full call documents with embedded transcripts
                  Indexes: call_id, status, started_at, (status + started_at)

agents          — Agent profiles with daily/monthly performance
                  Index: agent_id

alerts          — AI-detected issues with severity and resolution tracking
                  Indexes: alert_id, status

users           — Supervisor accounts
                  Indexes: user_id, email

user_sessions   — Auth session tokens (7-day expiry)
                  Index: session_token
```

### Query Optimization

All analytics endpoints use **MongoDB aggregation pipelines** instead of client-side processing:
- `$facet` for multi-count queries in a single roundtrip
- `$group` with `$avg`, `$sum`, `$max` for server-side computation
- `$addFields` + `$dateFromString` for hourly bucketing
- Explicit field projections on every query to minimize data transfer

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/session?session_id=` | Exchange OAuth session |
| GET | `/api/auth/me` | Get current supervisor |
| POST | `/api/auth/logout` | End session |

### Calls
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calls/active` | All active calls (summary) |
| GET | `/api/calls/history` | Ended calls (paginated) |
| GET | `/api/calls/{id}` | Full call detail + transcript |
| GET | `/api/calls/{id}/transcript` | Transcript only (paginated) |
| POST | `/api/calls/{id}/action` | Supervisor action (flag/note/transfer) |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Active alerts |
| GET | `/api/alerts/history` | All alerts |
| POST | `/api/alerts/{id}/acknowledge` | Acknowledge alert |
| POST | `/api/alerts/{id}/resolve` | Resolve with notes |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/realtime` | Live KPIs |
| GET | `/api/analytics/hourly` | Hourly call volume + sentiment |
| GET | `/api/analytics/agents` | Agent comparison |
| GET | `/api/analytics/issues` | Issue distribution |
| POST | `/api/analytics/export` | Export as JSON |

### Simulation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/simulation/start` | Start engine |
| POST | `/api/simulation/stop` | Stop engine |
| POST | `/api/simulation/config` | Update settings |
| POST | `/api/simulation/trigger-event` | Trigger scenario |
| GET | `/api/simulation/status` | Engine status |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `ws /api/ws/live` | Real-time updates (calls, alerts, metrics) |

---

## AI Engine Details

### Real-Time Analysis (Pattern-Based)
Every transcript message is analyzed instantly with zero API latency:

- **Sentiment Scoring** — 40+ negative patterns and 17+ positive patterns scored from -1.0 to +1.0 with weighted averaging
- **Intent Classification** — 9 categories: complaint, inquiry, request, escalation, greeting, closing, empathy, resolution
- **Entity Extraction** — Regex-based detection of dollar amounts, dates, product/plan mentions
- **Risk Flags** — churn_risk, escalation_needed, compliance_risk, profanity

### LLM Summarization (GPT-5.2)
When a call ends, the full transcript is sent to OpenAI GPT-5.2 for structured summarization:
```json
{
  "overall_sentiment": -0.35,
  "sentiment_trend": "declining",
  "primary_issue": "Billing dispute with unauthorized charges",
  "topics_discussed": ["billing", "refund", "account history"],
  "risk_level": "high",
  "churn_probability": 0.7,
  "recommended_actions": ["Issue full refund", "Assign retention specialist"]
}
```

Falls back to pattern-based summary if LLM is unavailable.

---

## Call Scenarios

The simulation engine includes **8 standard scenarios** and **3 trigger scenarios**:

| Scenario | Mood | Complexity | Messages |
|----------|------|------------|----------|
| Billing Dispute | Frustrated | Medium | 15 |
| Technical Issue | Confused | High | 15 |
| Cancellation Request | Angry | High | 15 |
| Product Inquiry | Pleasant | Low | 13 |
| Service Outage | Anxious | Medium | 15 |
| Refund Request | Disappointed | Medium | 13 |
| Account Security | Panicked | High | 15 |
| Shipping Issue | Worried | Low | 13 |

**Trigger scenarios** (on-demand via Simulation Controls):
- Angry Customer — furious, 5-year customer, threatening BBB
- Escalation Request — demanding manager, runaround complaint
- Compliance Issue — recording call, attorney mention, FTC threat

---

## Design System

| Element | Choice | Rationale |
|---------|--------|-----------|
| Theme | Dark (#0B1121 base) | Command center / NOC aesthetic |
| Headings | Chivo (Black 900) | Sharp, tactical feel |
| Body | IBM Plex Sans (400-600) | Readable at small sizes |
| Data | JetBrains Mono | Monospace for IDs, timestamps, scores |
| Primary | #3B82F6 (Electric Blue) | High contrast on dark |
| Success | #10B981 (Emerald) | Positive sentiment |
| Warning | #F59E0B (Amber) | Caution states |
| Error | #EF4444 (Red) | Critical alerts, negative sentiment |
| Cards | #151F32 with slate-700/50 border | Layered depth |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 6+

### Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure MONGO_URL, EMERGENT_LLM_KEY
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
yarn install
cp .env.example .env  # Set REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

### Environment Variables

**Backend (`/backend/.env`)**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=callpulse
CORS_ORIGINS=*
EMERGENT_LLM_KEY=<your-key>   # Optional: enables LLM call summarization
```

**Frontend (`/frontend/.env`)**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Demo Walkthrough

1. **Login** → Google OAuth → lands on supervisor dashboard
2. **Dashboard** → 12 live call cards updating every 3-5s with transcripts
3. **Spot an alert** → Red banner: "Churn Risk Detected" → click Acknowledge
4. **Deep-dive** → Click any call → full transcript scrolling, sentiment chart, AI insights
5. **Take action** → Flag call for QA review, add a supervisor note
6. **Check analytics** → Call volume chart, sentiment trends, issue breakdown
7. **View agents** → 8 agents with performance stats, on-call status
8. **Trigger scenario** → Go to Simulation → click "Angry Customer" → watch alert fire
9. **Export data** → Analytics → Export JSON for offline analysis

---

## Relevance to D365 Contact Center

| Platform Capability | CallPulse Implementation |
|---------------------|--------------------------|
| Omnichannel monitoring | Multi-call grid with real-time updates |
| AI conversation intelligence | Sentiment analysis, intent classification, entity extraction |
| Supervisor experience | Deep-dive, actions, notes, flagging |
| Intelligent routing signals | Risk scoring, escalation detection, churn probability |
| Knowledge suggestions | AI-recommended actions per call |
| Real-time analytics | WebSocket-powered live metrics |
| Historical reporting | Aggregation-based hourly/daily analytics |
| Alert & notification system | Multi-severity AI-triggered alerts |

---

## License

MIT

---

Built by [Utkarsha Gawade](https://github.com/utkarshagawade)
