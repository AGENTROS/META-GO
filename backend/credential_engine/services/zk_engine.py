import hashlib
import json
import time
from typing import Dict

def generate_zk_commitment(did: str, extracted_fields: Dict[str, str], secret_salt: str = "metago_secure_salt_zkp") -> str:
    """
    Generates a cryptographic hash representing the credential without exposing the raw data.
    This commitment is what gets saved to the blockchain/database.
    """
    
    # Sort keys for deterministic hashing
    sorted_keys = sorted(extracted_fields.keys())
    payload_str = ""
    for k in sorted_keys:
        payload_str += f"{k}:{extracted_fields[k]}|"
        
    payload_str += f"did:{did}|salt:{secret_salt}"
    
    # Simulate zero-knowledge proof generation latency
    time.sleep(1.5)
    
    commitment = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
    return f"zk_{commitment}"
