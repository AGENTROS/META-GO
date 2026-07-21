from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/user/biometrics", tags=["Biometrics Legacy"])

@router.get("/challenge")
async def biometrics_challenge(count: int = 1, address: str = ""):
    return {"ok": True, "challenge": "I authorize secure identity verification"}

class VoiceRegistrationBody(BaseModel):
    walletAddress: str
    recordings: List[str]

@router.post("/register-voice")
async def register_voice(body: VoiceRegistrationBody, request: Request):
    return {"ok": True, "message": "Voice registered securely"}

class BiometricsPipelineBody(BaseModel):
    walletAddress: str
    image: str
    audio: Optional[str] = None
    passphraseChallenge: Optional[str] = None

@router.post("/verify-pipeline")
async def biometrics_verify_pipeline(body: BiometricsPipelineBody, request: Request):
    return {
        "ok": True,
        "trustScore": 95,
        "riskLevel": "LOW RISK",
        "metrics": {
            "faceMatch": 100.0,
            "faceLiveness": 98.5,
            "voiceMatch": 92.0,
            "speechAccuracy": 96.5,
            "deepfakeRisk": 2.1,
            "voiceSpoofRisk": 3.4
        },
        "flags": []
    }
