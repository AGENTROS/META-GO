from core_services.identity_engine.models.did import DIDModel
from core_services.identity_engine.services.did_service import DIDService


def test_did_generation():
    did_obj = DIDService.generate_did()
    assert did_obj.did.startswith("did:metago:")
    assert DIDModel.validate_did(did_obj.did) is True


def test_did_validation():
    valid_did = "did:metago:12345678-1234-1234-1234-1234567890ab"
    invalid_did = "did:metago:invalid-format"

    assert DIDModel.validate_did(valid_did) is True
    assert DIDModel.validate_did(invalid_did) is False
