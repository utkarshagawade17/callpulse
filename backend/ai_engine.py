import os
import json
import logging
import re
import uuid
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')


def analyze_message(text, speaker):
    """Pattern-based real-time message analysis"""
    text_lower = text.lower()

    negative_patterns = {
        r"cancel\s+(my\s+)?account": -0.9,
        r"speak\s+to\s+(a\s+)?manager": -0.6,
        r"speak\s+to\s+(a\s+)?supervisor": -0.6,
        r"ridiculous": -0.7,
        r"unacceptable": -0.7,
        r"been\s+waiting": -0.5,
        r"terrible": -0.8,
        r"worst": -0.85,
        r"going\s+to\s+sue": -0.95,
        r"bbb|better\s+business": -0.8,
        r"never\s+again": -0.7,
        r"fed\s+up": -0.8,
        r"furious": -0.9,
        r"waste\s+of\s+(my\s+)?time": -0.7,
        r"competitor": -0.6,
        r"switch\s+provider": -0.7,
        r"file\s+a\s+complaint": -0.7,
        r"third\s+time": -0.75,
        r"nobody\s+cares": -0.8,
        r"overcharged": -0.6,
        r"unauthorized": -0.8,
        r"fraud": -0.9,
        r"frustrated": -0.6,
        r"angry": -0.7,
        r"disappointed": -0.5,
        r"horrible": -0.8,
        r"incompetent": -0.8,
        r"useless": -0.7,
        r"doesn'?t\s+work": -0.5,
        r"not\s+working": -0.5,
        r"charged\s+twice": -0.7,
        r"wrong\s+charge": -0.6,
        r"broken": -0.4,
        r"problem": -0.3,
        r"issue": -0.2,
        r"upset": -0.6,
        r"annoyed": -0.5,
        r"sick\s+of": -0.7,
        r"tired\s+of": -0.5,
    }

    positive_patterns = {
        r"thank\s+you(\s+so\s+much)?": 0.8,
        r"really\s+helpful": 0.7,
        r"appreciate": 0.7,
        r"great\s+(service|help)": 0.8,
        r"problem\s+solved": 0.8,
        r"that\s+works": 0.5,
        r"sounds\s+good": 0.4,
        r"makes\s+sense": 0.3,
        r"wonderful": 0.8,
        r"excellent": 0.8,
        r"perfect": 0.7,
        r"happy(\s+with)?": 0.6,
        r"satisfied": 0.6,
        r"resolved": 0.7,
        r"fixed": 0.6,
        r"good\s+news": 0.5,
        r"glad": 0.5,
    }

    agent_positive = {
        r"apologize|sorry": 0.2,
        r"understand": 0.2,
        r"help\s+you": 0.3,
        r"let\s+me": 0.2,
        r"right\s+away": 0.3,
        r"take\s+care": 0.3,
        r"credit|refund": 0.4,
        r"resolve": 0.3,
    }

    neg_scores = []
    pos_scores = []

    for pattern, score in negative_patterns.items():
        if re.search(pattern, text_lower):
            neg_scores.append(score)

    for pattern, score in positive_patterns.items():
        if re.search(pattern, text_lower):
            pos_scores.append(score)

    if speaker == "agent":
        for pattern, score in agent_positive.items():
            if re.search(pattern, text_lower):
                pos_scores.append(score)

    if neg_scores and pos_scores:
        sentiment = (min(neg_scores) + max(pos_scores)) / 2
    elif neg_scores:
        sentiment = sum(neg_scores) / len(neg_scores)
    elif pos_scores:
        sentiment = sum(pos_scores) / len(pos_scores)
    else:
        sentiment = 0.15 if speaker == "agent" else 0.0

    sentiment = max(-1.0, min(1.0, round(sentiment, 2)))

    # Intent classification
    intent = "inquiry"
    if re.search(r"cancel|terminate|close\s+account|end\s+my", text_lower):
        intent = "escalation"
    elif re.search(r"manager|supervisor|escalate|someone\s+else", text_lower):
        intent = "escalation"
    elif re.search(r"complaint|terrible|worst|horrible|angry|frustrated|ridiculous", text_lower):
        intent = "complaint"
    elif re.search(r"refund|money\s+back|credit|reimburse", text_lower):
        intent = "request"
    elif re.search(r"help|how|what|when|where|why", text_lower) and speaker == "customer":
        intent = "inquiry"
    elif re.search(r"please|need|want|require|request|could\s+you|can\s+you", text_lower):
        intent = "request"
    elif re.search(r"hello|hi\b|good\s+(morning|afternoon|evening)|welcome|thank.*call", text_lower):
        intent = "greeting"
    elif re.search(r"thank|bye|goodbye|have\s+a\s+(good|great)", text_lower):
        intent = "closing"
    elif speaker == "agent" and re.search(r"sorry|apologize|understand|hear\s+that", text_lower):
        intent = "empathy"
    elif re.search(r"resolved|fixed|taken\s+care|applied|processed|credit", text_lower):
        intent = "resolution"

    # Flags
    flags = []
    if re.search(r"cancel|leave|competitor|switch|go\s+somewhere", text_lower):
        flags.append("churn_risk")
    if re.search(r"manager|supervisor|escalate|speak\s+to\s+someone", text_lower):
        flags.append("escalation_needed")
    if re.search(r"sue|lawyer|legal|attorney|bbb|report|regulat", text_lower):
        flags.append("compliance_risk")
    if re.search(r"(f+u+c+k|s+h+i+t|damn\s+it|bastard|idiot)", text_lower):
        flags.append("profanity")

    # Entities
    entities = []
    for amt in re.findall(r'\$[\d,]+\.?\d*', text):
        entities.append({"type": "amount", "value": amt})
    for d in re.findall(r'\b\d{1,2}/\d{1,2}/\d{2,4}\b', text):
        entities.append({"type": "date", "value": d})
    products = re.findall(r'\b(premium|standard|basic|pro|enterprise|business|starter)\s*(plan|package|tier|account)?\b', text_lower)
    for p in products:
        entities.append({"type": "product", "value": " ".join(p).strip()})

    return {
        "sentiment": sentiment,
        "intent": intent,
        "entities": entities,
        "flags": flags
    }


async def summarize_call_llm(transcript_messages):
    """Use LLM to summarize a completed call"""
    if not EMERGENT_LLM_KEY:
        return generate_fallback_summary(transcript_messages)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"summary-{uuid.uuid4().hex[:8]}",
            system_message="You are a contact center AI analyst. Return ONLY valid JSON, no markdown."
        ).with_model("openai", "gpt-5.2")

        transcript_text = "\n".join([
            f"{'Customer' if m.get('speaker') == 'customer' else 'Agent'}: {m.get('text', '')}"
            for m in transcript_messages[-20:]
        ])

        prompt = f"""Summarize this call transcript. Return ONLY valid JSON:
{{"overall_sentiment": <float -1 to 1>, "sentiment_trend": "<improving|stable|declining>", "primary_issue": "<brief>", "topics_discussed": ["<t1>","<t2>"], "risk_level": "<low|medium|high|critical>", "churn_probability": <float 0-1>, "recommended_actions": ["<a1>","<a2>"]}}

Transcript:
{transcript_text}"""

        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```\w*\n?', '', cleaned)
            cleaned = re.sub(r'\n?```$', '', cleaned)
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"LLM summary error: {e}")
        return generate_fallback_summary(transcript_messages)


def generate_fallback_summary(transcript_messages):
    if not transcript_messages:
        return {
            "overall_sentiment": 0.0, "sentiment_trend": "stable",
            "primary_issue": "General inquiry", "topics_discussed": ["general"],
            "risk_level": "low", "churn_probability": 0.1,
            "recommended_actions": ["Follow up with customer"]
        }

    sentiments = [m.get("analysis", {}).get("sentiment", 0) for m in transcript_messages if m.get("analysis")]
    avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0

    trend = "stable"
    if len(sentiments) >= 4:
        first_half = sum(sentiments[:len(sentiments)//2]) / (len(sentiments)//2)
        second_half = sum(sentiments[len(sentiments)//2:]) / (len(sentiments) - len(sentiments)//2)
        if second_half > first_half + 0.15:
            trend = "improving"
        elif second_half < first_half - 0.15:
            trend = "declining"

    risk = "low"
    if avg_sentiment < -0.6:
        risk = "critical"
    elif avg_sentiment < -0.3:
        risk = "high"
    elif avg_sentiment < 0:
        risk = "medium"

    all_flags = []
    for m in transcript_messages:
        all_flags.extend(m.get("analysis", {}).get("flags", []))

    churn_prob = 0.8 if "churn_risk" in all_flags else (0.4 if risk in ["high", "critical"] else 0.1)

    topics = list(set([m.get("analysis", {}).get("intent", "inquiry") for m in transcript_messages if m.get("analysis")]))

    return {
        "overall_sentiment": round(avg_sentiment, 2),
        "sentiment_trend": trend,
        "primary_issue": "Customer service inquiry",
        "topics_discussed": topics[:5],
        "risk_level": risk,
        "churn_probability": round(churn_prob, 2),
        "recommended_actions": ["Review call recording", "Follow up with customer"]
    }
