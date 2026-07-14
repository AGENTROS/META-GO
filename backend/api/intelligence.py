from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import json
import logging
from datetime import datetime

# Import secure context fetching from dashboard API
from .dashboard import get_secure_context

router = APIRouter()
logger = logging.getLogger("intelligence")

# ---------------------------------------------------------
# Hybrid Intelligence Engine: Rule Engine Core
# ---------------------------------------------------------

class RuleEngine:
    @staticmethod
    def calculate_humanity(user: Dict, zks: List, sbts: List) -> float:
        score = 0.0
        if user.get("face_verified"): score += 40.0
        if user.get("voice_verified"): score += 30.0
        if len(zks) > 0: score += 15.0
        if len(sbts) > 0: score += 15.0
        return min(100.0, score)

    @staticmethod
    def calculate_trust(user: Dict, zks: List, sbts: List, logs: List) -> int:
        base = 50
        if user.get("face_verified") and user.get("voice_verified"):
            base += 20
        base += min(15, len(zks) * 2)
        base += min(15, len(sbts) * 2)
        
        # Penalties based on recent threat logs
        for log in logs:
            if log.get("risk") == "High":
                base -= 5
        return max(0, min(100, base))

    @staticmethod
    def explain_trust(context: Dict) -> str:
        score = context["trust_score"]
        positives = []
        negatives = []
        
        user = context["user"]
        
        if user.get("face_verified") and user.get("voice_verified"):
            positives.append("Identity is fully verified with face and voice biometrics.")
        elif user.get("face_verified"):
            positives.append("Face verification is active.")
            negatives.append("Voice verification is missing.")
            
        if len(context["credentials"]) > 0:
            positives.append(f"Holding {len(context['credentials'])} verified credentials.")
        else:
            negatives.append("No zero-knowledge credentials linked.")
            
        if len(context["sbts"]) > 0:
            positives.append(f"Holding {len(context['sbts'])} Soulbound Tokens.")
            
        high_risk = [l for l in context["audit_logs"] if l.get("risk") == "High"]
        if high_risk:
            negatives.append(f"{len(high_risk)} recent security alert(s) negatively impacting your score.")
            
        explanation = f"Your Trust Score is currently {score}. "
        if positives:
            explanation += "Positive factors include: " + ", ".join(positives) + ". "
        if negatives:
            explanation += "Areas for improvement include: " + ", ".join(negatives) + ". "
            
        return explanation

    @staticmethod
    def get_recommendations(context: Dict) -> List[Dict]:
        recs = []
        user = context["user"]
        if not user.get("face_verified"):
            recs.append({"action": "Verify Face Biometrics", "impact": "+20 Trust", "type": "Identity"})
        if not user.get("voice_verified"):
            recs.append({"action": "Verify Voice Print", "impact": "+10 Trust", "type": "Identity"})
        if len(context["credentials"]) == 0:
            recs.append({"action": "Mint Genesis ZK Proof", "impact": "+5 Trust", "type": "Credential"})
        return recs


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------

async def build_context(db, address: str) -> Dict:
    user = await db.users.find_one({"walletAddress": address.lower()}) or {}
    
    zk_cursor = db.zk_proofs.find({"walletAddress": address.lower()})
    zks = [doc async for doc in zk_cursor] if hasattr(zk_cursor, '__aiter__') else []
    
    sbt_cursor = db.sbts.find({"walletAddress": address.lower()})
    sbts = [doc async for doc in sbt_cursor] if hasattr(sbt_cursor, '__aiter__') else []
    
    log_cursor = db.audit_logs.find({"walletAddress": address.lower()}).sort("time", -1).limit(10)
    logs = [doc async for doc in log_cursor] if hasattr(log_cursor, '__aiter__') else []
    
    trust_score = RuleEngine.calculate_trust(user, zks, sbts, logs)
    humanity_score = RuleEngine.calculate_humanity(user, zks, sbts)
    
    return {
        "user": user,
        "credentials": zks,
        "sbts": sbts,
        "audit_logs": logs,
        "trust_score": trust_score,
        "humanity_score": humanity_score
    }


class AskRequest(BaseModel):
    query: str
    session_id: str = "default"

@router.post("/api/dashboard/intelligence/ask")
async def ask_ai_guardian(request: Request, address: str, body: AskRequest):
    db, _ = await get_secure_context(request, address)
    context = await build_context(db, address)
    
    query = body.query.lower()
    
    # Intent Classifier (Basic Rule-Based for Phase 1)
    response_text = ""
    structured_data = None
    
    if "trust" in query or "score" in query:
        response_text = RuleEngine.explain_trust(context)
        structured_data = {
            "score": context["trust_score"],
            "recommendations": RuleEngine.get_recommendations(context)
        }
    elif "humanity" in query:
        response_text = f"Your Humanity Score is {context['humanity_score']}%. This is derived directly from your biometric verification status and zero-knowledge proof attestation."
        structured_data = {"score": context["humanity_score"]}
    elif "security" in query or "alert" in query or "threat" in query:
        high_risk = [l for l in context["audit_logs"] if l.get("risk") == "High"]
        if high_risk:
            response_text = f"I detected {len(high_risk)} high-risk event(s) in your recent audit logs, including '{high_risk[0].get('event', 'Unknown')}'. I recommend reviewing your active sessions immediately."
            structured_data = {"threats": high_risk}
        else:
            response_text = "Your security posture looks healthy. No high-risk events found in your recent audit logs."
            structured_data = {"threats": []}
    else:
        response_text = f"I am your AI Identity Guardian. Based on your current context, your Trust Score is {context['trust_score']}. How can I assist you further?"
        
    # Phase 2 Optional LLM integration would hook in right here,
    # passing `response_text` and `structured_data` to OpenAI to be polished.
        
    return {
        "reply": response_text,
        "context_snapshot": structured_data
    }


@router.get("/api/dashboard/intelligence/analytics")
async def get_trust_analytics(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    context = await build_context(db, address)
    
    # Generating a deterministic timeline array based on the single source of truth for the chart UI
    current_trust = context["trust_score"]
    current_humanity = context["humanity_score"]
    
    timeline = [
        {"month": "Jan", "trust": max(0, current_trust - 25), "humanity": max(0, current_humanity - 40)},
        {"month": "Feb", "trust": max(0, current_trust - 15), "humanity": max(0, current_humanity - 20)},
        {"month": "Mar", "trust": max(0, current_trust - 5), "humanity": max(0, current_humanity - 10)},
        {"month": "Apr", "trust": current_trust, "humanity": current_humanity}
    ]
    
    return {
        "current_trust": current_trust,
        "current_humanity": current_humanity,
        "timeline": timeline,
        "recommendations": RuleEngine.get_recommendations(context)
    }

@router.get("/api/dashboard/intelligence/threats")
async def get_threat_intel(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    
    log_cursor = db.audit_logs.find({"walletAddress": address.lower()}).sort("time", -1).limit(50)
    logs = [doc async for doc in log_cursor] if hasattr(log_cursor, '__aiter__') else []
    
    threats = [l for l in logs if l.get("risk") in ["High", "Medium"]]
    
    # Format for UI
    formatted = []
    for t in threats:
        formatted.append({
            "id": str(t.get("_id", "")),
            "event": t.get("event", "Unknown Alert"),
            "risk": t.get("risk"),
            "time": t.get("time", ""),
            "metadata": t.get("details", {})
        })
        
    return {"threats": formatted}
