import pytest
from fastapi.testclient import TestClient
import io
from PIL import Image, ImageDraw, ImageFont
import json
import asyncio
from unittest.mock import patch, MagicMock

from fastapi import FastAPI
from credential_engine.api.credentials import router

# Spin up an isolated test app to avoid monolithic server.py relative import crashes
app = FastAPI()
app.include_router(router)

# Import EventPublisher to track events
from credential_engine.events.publisher import EventPublisher
from credential_engine.repository.db import get_credentials_by_owner

client = TestClient(app, raise_server_exceptions=True)


# Helper function to generate a valid dummy image in memory
def generate_dummy_image_bytes(size=(800, 500), corrupted=False, too_large=False):
    if corrupted:
        return b"This is not a valid image. It is corrupted bytes."

    if too_large:
        # Generate exactly 11MB of zeroes (Simulating a file larger than the 10MB limit)
        return b"0" * (11 * 1024 * 1024)

    img = Image.new("RGB", size, color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 32)
    except Exception:
        font = ImageFont.load_default()

    d.text((50, 50), "GOVERNMENT OF INDIA", fill=(0, 0, 0), font=font)
    d.text((50, 150), "NAME: RAHUL SHARMA", fill=(0, 0, 0), font=font)
    d.text((50, 220), "DOB: 12/08/1999", fill=(0, 0, 0), font=font)
    d.text((50, 350), "1234 5678 1234", fill=(0, 0, 0), font=font)

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    return img_byte_arr.getvalue()


# --- TEST SUITE ---


def test_api_upload_invalid_corrupted_file():
    """Security Test: Verifies corrupted or non-image payloads are violently rejected."""
    corrupted_bytes = generate_dummy_image_bytes(corrupted=True)

    response = client.post(
        "/api/v1/credentials/upload",
        files={"file": ("fake_aadhaar.jpg", corrupted_bytes, "image/jpeg")},
        data={"document_type": "Aadhaar"},
    )

    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"].lower()


def test_api_upload_oversized_file():
    """Security Test: Verifies >10MB bombs are rejected before OpenCV processes them."""
    massive_bytes = generate_dummy_image_bytes(too_large=True)

    response = client.post(
        "/api/v1/credentials/upload",
        files={"file": ("massive.jpg", massive_bytes, "image/jpeg")},
        data={"document_type": "Aadhaar"},
    )

    assert response.status_code == 400
    assert "exceeds maximum size" in response.json()["detail"].lower()


@patch("credential_engine.events.publisher.EventPublisher.publish")
def test_end_to_end_ocr_upload_pipeline(mock_publish):
    """Integration Test: Full upload -> Enhance -> Extract -> Response."""
    valid_bytes = generate_dummy_image_bytes()

    response = client.post(
        "/api/v1/credentials/upload",
        files={"file": ("test_aadhaar.jpg", valid_bytes, "image/jpeg")},
        data={"document_type": "Aadhaar"},
    )

    assert response.status_code == 200
    data = response.json()

    # Verify Document Type
    assert data["document_type"] == "Aadhaar"

    # Verify Fields
    assert "aadhaar_number" in data["fields"]
    assert "dob" in data["fields"]
    assert "name" in data["fields"]

    # Verify Event publishing
    mock_publish.assert_any_call(
        "Credential.Uploaded", {"filename": "test_aadhaar.jpg", "type": "Aadhaar"}
    )
    # It should have also published processed
    assert mock_publish.call_count >= 2


@patch("credential_engine.repository.db.db.issued_credentials.insert_one")
@patch("credential_engine.events.publisher.EventPublisher.publish")
def test_end_to_end_credential_issuance(mock_publish, mock_insert):
    """Integration Test: Verification -> ZK Hash -> DB -> Event Publication."""

    # Mocking motor async insert
    async def mock_async_insert(doc):
        class MockResult:
            inserted_id = "mock_id_123"

        return MockResult()

    mock_insert.side_effect = mock_async_insert

    payload = {
        "address": "did:metago:0x123",
        "document_type": "Aadhaar",
        "extracted_data": {
            "name": "NAME: RAHUL SHARMA",
            "dob": "DOB: 12/08/1999",
            "aadhaar_number": "1234 5678 1234",
        },
    }

    response = client.post("/api/v1/credentials/verify", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "credential" in data

    cred = data["credential"]
    assert cred["document_type"] == "Aadhaar"
    assert cred["owner_wallet"] == "did:metago:0x123"
    assert cred["zk_commitment"].startswith("zk_")  # Proves the hash engine ran

    # Verify Events for Passport/Guardian updates
    mock_publish.assert_any_call(
        "Credential.Verified", {"id": cred["id"], "owner": "did:metago:0x123"}
    )
    mock_publish.assert_any_call(
        "Credential.Issued", {"id": cred["id"], "type": "Aadhaar"}
    )
