import time
import hashlib
import os
import logging
from typing import Dict, Any, List
from web3 import Web3

logger = logging.getLogger("zk_verifier")


def poseidon_sim_hash(values: List[Any]) -> int:
    """
    Deterministic simulated Poseidon hash matching the frontend implementation
    for verifying simulation proofs.
    """
    acc = 0x12345
    p = 0x30644E72E131A029B85045B68181585D2833E84879B9709143E1F593F0000001
    for v in values:
        if isinstance(v, (int, float)):
            x = int(v)
        else:
            val_str = str(v)[:12]
            try:
                x = int(val_str, 36)
            except ValueError:
                x = 1
        acc = (acc * 31 + x) % p
    return acc


class StructuralVerifier:
    @staticmethod
    def verify_proof_structure(
        proof: Dict[str, Any], public_signals: List[Any]
    ) -> bool:
        if not isinstance(proof, dict) or not isinstance(public_signals, list):
            return False

        protocol = proof.get("protocol", "unknown")
        curve = proof.get("curve", "unknown")

        if protocol == "unknown" and "algorithm" in proof:
            alg = proof["algorithm"]
            if alg == "simulation-bn128":
                protocol = "simulation"
                curve = "bn128"
            elif alg == "groth16-bn128":
                protocol = "groth16"
                curve = "bn128"

        # In production and test mode, we only accept standard Groth16 proofs on BN128
        if protocol != "groth16" or curve != "bn128":
            return False

        # Validate Groth16 proof format parameters (pi_a, pi_b, pi_c)
        if not all(k in proof for k in ("pi_a", "pi_b", "pi_c")):
            return False

        try:
            pi_a = proof["pi_a"]
            pi_b = proof["pi_b"]
            pi_c = proof["pi_c"]

            # Real Groth16 structural length checks
            if len(pi_a) != 2 and len(pi_a) != 3:
                return False
            if len(pi_b) != 2:
                return False
            if len(pi_b[0]) != 2 or len(pi_b[1]) != 2:
                return False
            if len(pi_c) != 2 and len(pi_c) != 3:
                return False

            # Verify coordinates are valid integer representations
            for coord in pi_a:
                int(str(coord))
            for row in pi_b:
                for coord in row:
                    int(str(coord))
            for coord in pi_c:
                int(str(coord))

            # Verify public signals structure
            if len(public_signals) < 2:
                return False

            # All signals must be bigints
            for s in public_signals:
                int(str(s))

            return True
        except (ValueError, TypeError, KeyError):
            return False


class CryptographicVerifier:
    @staticmethod
    def verify_proof_cryptographically(
        proof: Dict[str, Any], public_signals: List[Any]
    ) -> bool:
        try:
            from relayer import relayer
        except Exception:
            from relayer import relayer

        if not relayer.available() or "Groth16Verifier" not in relayer.addresses:
            return False

        try:
            w3 = relayer.w3
            verifier_addr = relayer.addresses["Groth16Verifier"]

            # Cryptographic Circuit Binding Check
            expected_circuit_hash = os.environ.get(
                "EXPECTED_CIRCUIT_HASH",
                "0x5c42173a88a09bde16ea11100000000000000000000000000000000000000000",
            )
            expected_vk_version = os.environ.get("VERIFICATION_KEY_VERSION", "v1.0.0")

            # Verify circuit config matches
            current_vk_version = os.environ.get("CURRENT_VK_VERSION", "v1.0.0")
            current_circuit_hash = os.environ.get(
                "CURRENT_CIRCUIT_HASH", expected_circuit_hash
            )

            if (
                current_vk_version != expected_vk_version
                or current_circuit_hash != expected_circuit_hash
            ):
                logger.critical(
                    f"CRITICAL: Circuit metadata mismatch. VK: {current_vk_version}, Hash: {current_circuit_hash}"
                )
                return False

            pi_a = [int(x) for x in proof["pi_a"][:2]]
            pi_b = [[int(x) for x in row[:2]] for row in proof["pi_b"][:2]]
            pi_c = [int(x) for x in proof["pi_c"][:2]]

            inputs = [int(x) for x in public_signals[:4]]
            while len(inputs) < 4:
                inputs.append(0)

            contract = w3.eth.contract(
                address=Web3.to_checksum_address(verifier_addr),
                abi=[
                    {
                        "inputs": [
                            {
                                "internalType": "uint256[2]",
                                "name": "_a",
                                "type": "uint256[2]",
                            },
                            {
                                "internalType": "uint256[2][2]",
                                "name": "_b",
                                "type": "uint256[2][2]",
                            },
                            {
                                "internalType": "uint256[2]",
                                "name": "_c",
                                "type": "uint256[2]",
                            },
                            {
                                "internalType": "uint256[4]",
                                "name": "_input",
                                "type": "uint256[4]",
                            },
                        ],
                        "name": "verifyProof",
                        "outputs": [
                            {"internalType": "bool", "name": "", "type": "bool"}
                        ],
                        "stateMutability": "view",
                        "type": "function",
                    }
                ],
            )

            return contract.functions.verifyProof(pi_a, pi_b, pi_c, inputs).call()
        except Exception as e:
            logger.error(f"[ZK CRYPTO FAILURE] Cryptographic verifyProof failed: {e}")
            return False


class MockSnarkjsVerifier:
    """
    Validates commitment and nullifier constraints, verifying formatting
    and curve properties of Groth16 SnarkJS proofs.
    """

    @staticmethod
    def verify_proof(proof: Dict[str, Any], public_signals: List[Any]) -> bool:
        try:
            from observability import increment_counter
        except Exception:
            from observability import increment_counter

        if not StructuralVerifier.verify_proof_structure(proof, public_signals):
            increment_counter("proof_failures_total")
            return False
        res = CryptographicVerifier.verify_proof_cryptographically(
            proof, public_signals
        )
        if not res:
            increment_counter("proof_failures_total")
        return res

    @staticmethod
    def verify_simulation_commitment(
        biometric_hash: int,
        wallet_secret: int,
        user_salt: int,
        timestamp: int,
        commitment: int,
        nullifier: int,
        chain_id: int,
        app_domain_separator: str,
    ) -> bool:
        """
        Symmetric verification of Poseidon commitments.
        IdentityCommitment = Poseidon(biometric_hash, device_secret, user_salt, chain_id, app_domain_separator)
        """
        expected_commit = poseidon_sim_hash(
            [biometric_hash, wallet_secret, user_salt, chain_id, app_domain_separator]
        )
        expected_null = poseidon_sim_hash(
            [biometric_hash, wallet_secret, timestamp, chain_id, app_domain_separator]
        )
        return expected_commit == commitment and expected_null == nullifier
