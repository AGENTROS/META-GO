import json
import pytest
from pathlib import Path
from jsonschema import validate, ValidationError

# Mount the global schema directory
SCHEMA_DIR = Path(__file__).parent.parent.parent / "docs" / "protocol" / "schemas"

def load_schema(filename):
    with open(SCHEMA_DIR / filename) as f:
        return json.load(f)

@pytest.fixture
def event_schema():
    return load_schema("event.schema.json")

@pytest.fixture
def presence_schema():
    return load_schema("presence.schema.json")

def test_valid_event_envelope(event_schema):
    """Proves the core envelope structure passes schema validation."""
    valid_payload = {
        "version": "1.0",
        "event": "Presence.Active",
        "timestamp": 1719000000.0,
        "payload": {}
    }
    validate(instance=valid_payload, schema=event_schema)

def test_invalid_event_version_rejected(event_schema):
    """Proves the schema aggressively rejects backwards-incompatible versions."""
    invalid_payload = {
        "version": "2.0.0-beta", # Fails strictly enforced 'X.Y' regex
        "event": "Presence.Active",
        "timestamp": 1719000000.0,
        "payload": {}
    }
    with pytest.raises(ValidationError):
        validate(instance=invalid_payload, schema=event_schema)

def test_valid_presence_payload(presence_schema):
    """Proves Vector3/Quaternion mathematical structures are validated."""
    valid_presence = {
        "user_id": "did:metago:0x123",
        "position": [0.0, 1.5, 0.0],
        "rotation": [0.0, 0.0, 0.0, 1.0]
    }
    validate(instance=valid_presence, schema=presence_schema)

def test_invalid_presence_payload(presence_schema):
    """Proves the schema rejects malformed array geometries."""
    invalid_presence = {
        "user_id": "did:metago:0x123",
        "position": [0.0, 1.5], # 2D instead of 3D
        "rotation": [0.0, 0.0, 0.0, 1.0]
    }
    with pytest.raises(ValidationError):
        validate(instance=invalid_presence, schema=presence_schema)
