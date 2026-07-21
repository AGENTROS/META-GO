from core_services.trust_engine.models.trust_score import TrustScoreModel

def test_trust_score_composite_calculation():
    # Test perfectly trusted identity
    score = TrustScoreModel(
        did="did:metago:123",
        humanity_score=100.0,
        identity_confidence=100.0,
        wallet_trust=100.0,
        social_trust=100.0
    )
    assert score.composite_trust == 100.0

    # Test risk deductions
    score_with_risk = TrustScoreModel(
        did="did:metago:123",
        humanity_score=100.0,
        identity_confidence=100.0,
        wallet_trust=100.0,
        social_trust=100.0,
        risk_score=50.0,
        fraud_probability=10.0
    )
    
    # Base: 40 + 30 + 20 + 10 = 100
    # Deduction: (50 * 0.5) + (10 * 0.8) = 25 + 8 = 33
    # Composite: 100 - 33 = 67
    assert score_with_risk.composite_trust == 67.0
