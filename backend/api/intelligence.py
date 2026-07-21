from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Dict, Any, List
import json
import logging
from datetime import datetime, timezone

# Import secure context fetching from dashboard API
from .dashboard import get_secure_context
from guardian_transcription_service import get_guardian_stt_model

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
    
    query = body.query.lower().strip()
    response_text = ""
    structured_data = None

    # 1. Greetings & Capabilities
    if any(greet in query for greet in ["hi", "hello", "hey", "who are you", "what can you do", "help"]):
        response_text = (
            "I am your MetaGo AI Identity Guardian. I monitor your trust score, humanity index, and security logs in real time. "
            "You can ask me to:\n"
            "- Explain your current **Trust Score**\n"
            "- Check your **Humanity Index** and biometric status\n"
            "- List recent **security alerts** or active sessions\n\n"
            "*Note: For security reasons, I am strictly sandboxed to audit requests regarding your sovereign identity and cannot answer general-purpose questions.*"
        )
        structured_data = {
            "capabilities": ["explain_trust", "check_humanity", "list_alerts"]
        }

    # 2. Trust Score & recommendations
    elif any(keyword in query for keyword in ["trust", "score", "explain", "recommend", "what can you do"]):
        explanation = RuleEngine.explain_trust(context)
        recs = RuleEngine.get_recommendations(context)
        recs_str = "\n".join([f"- **{r['action']}** (Impact: {r['impact']})" for r in recs])
        
        response_text = f"{explanation}\n\n"
        if recs:
            response_text += f"**Recommendations to improve your score:**\n{recs_str}"
        else:
            response_text += "Great job! You have no outstanding security recommendations."
            
        structured_data = {
            "score": context["trust_score"],
            "recommendations": recs
        }

    # 3. Humanity score & Biometric verification details
    elif any(keyword in query for keyword in ["humanity", "biometric", "face", "voice", "identity state"]):
        user = context["user"]
        face_status = "✅ ACTIVE" if user.get("face_verified") else "❌ INACTIVE"
        voice_status = "✅ ACTIVE" if user.get("voice_verified") else "❌ INACTIVE"
        
        response_text = (
            f"Your **Humanity Score** is currently **{context['humanity_score']}%**.\n\n"
            f"**Biometric Pipeline Status:**\n"
            f"- Face Verification: {face_status}\n"
            f"- Voice Print: {voice_status}\n\n"
            "This score represents your probability of being a verified unique human actor. You can raise it by verifying any remaining biometrics."
        )
        structured_data = {
            "score": context["humanity_score"],
            "face_verified": user.get("face_verified", False),
            "voice_verified": user.get("voice_verified", False)
        }

    # 4. Security status, active alerts and audit logs
    elif any(keyword in query for keyword in ["security", "alert", "threat", "session", "log"]):
        high_risk = [l for l in context["audit_logs"] if l.get("risk") == "High"]
        recent_events = "\n".join([f"- {l.get('event', 'Audit event')} ({l.get('time', 'unknown')}) [Risk: {l.get('risk', 'Low')}]" for l in context["audit_logs"][:3]])
        
        response_text = f"**Current Security Audit:**\n"
        if high_risk:
            response_text += (
                f"🚨 **WARNING:** I detected {len(high_risk)} high-risk event(s) in your recent logs. "
                f"Specifically: '{high_risk[0].get('event', 'unknown')}' from IP {high_risk[0].get('ip', 'unknown')}. "
                "I strongly advise reviewing your active sessions and rotating keys.\n\n"
            )
        else:
            response_text += "🟢 Your security posture is healthy. No high-risk threats detected in your recent audit logs.\n\n"
            
        if recent_events:
            response_text += f"**Recent Audit Logs:**\n{recent_events}"
            
        structured_data = {
            "threats": high_risk,
            "recent_logs": context["audit_logs"][:3]
        }

    # 5. Sandboxed / Rejected prompts (dimag and restriction)
    else:
        response_text = (
            "⚠️ **Access Denied (Sandbox Restriction):** As a localized security agent, I am locked down to MetaGo sovereign identity operations. "
            "I do not have access to general knowledge or capabilities outside of auditing your biometrics, trust score, and security logs."
        )
        structured_data = {
            "restricted": True
        }

    # 6. Save to conversation memory
    msg_id = f"msg_{int(datetime.now(timezone.utc).timestamp()*1000)}"
    memory_doc = {
        "walletAddress": address.lower(),
        "session_id": body.session_id,
        "query": query,
        "reply": response_text,
        "timestamp": datetime.now(timezone.utc)
    }
    # Keep only last 10 messages for bounded memory
    await db.guardian_conversations.update_one(
        {"walletAddress": address.lower(), "session_id": body.session_id},
        {
            "$push": {
                "messages": {
                    "$each": [memory_doc],
                    "$slice": -10 
                }
            },
            "$set": {"updated_at": datetime.now(timezone.utc)}
        },
        upsert=True
    )

    return {
        "reply": response_text,
        "context_snapshot": structured_data
    }

@router.post("/api/dashboard/intelligence/transcribe")
async def transcribe_audio(
    request: Request,
    address: str = Form(...),
    audio: UploadFile = File(...)
):
    # Authenticate user session
    db, _ = await get_secure_context(request, address)
    
    # Read and validate audio size/type
    audio_bytes = await audio.read()
    if len(audio_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="Audio file too large")
        
    stt = get_guardian_stt_model()
    result = stt.validate_and_transcribe(audio_bytes)
    
    if not result.get("ok"):
        return result  # Returns gracefully with ok: False and code
        
    return {
        "ok": True,
        "text": result.get("text")
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
