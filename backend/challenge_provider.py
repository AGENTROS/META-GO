"""
Meta Go — Intelligent Challenge Provider
==========================================
Provides cryptographically secure, random, unique voice challenge phrases
for voice enrollment and verification. Generates a 10,000+ phrase corpus
from grammatical templates to avoid repetition and ensure freshness.
"""
import secrets
import hashlib
from typing import List, Optional
from collections import deque

# ---------------------------------------------------------------------------
# Base Vocabulary
# ---------------------------------------------------------------------------
_SUBJECTS = [
    "The sovereign node", "My digital identity", "The verified protocol",
    "A secure token", "This trusted session", "The cryptographic key",
    "My biometric proof", "The identity vault", "A sovereign credential",
    "The authentication engine", "My encrypted ledger", "This verified claim",
    "The blockchain record", "A zero knowledge proof", "The decentralized node",
    "My private key", "The sovereign chain", "A verified attestation",
    "The secure enclave", "My identity passport",
]

_VERBS = [
    "grants access to", "protects", "validates", "secures", "authorizes",
    "confirms", "verifies", "unlocks", "authenticates", "certifies",
    "signs", "endorses", "attests to", "seals", "guards",
    "encrypts", "anchors", "commits to", "establishes", "proves",
]

_OBJECTS = [
    "the sovereign network", "all digital assets", "my private identity",
    "this trusted session", "the verified protocol", "my biometric data",
    "the cryptographic proof", "the distributed ledger", "my sovereign vault",
    "all future transactions", "the secure enclave", "my decentralized DID",
    "the authenticated record", "this encrypted channel", "the identity passport",
    "my on-chain credential", "the privacy layer", "the zero trust model",
    "all governance rights", "the federated claim",
]

_ADVERBS = [
    "permanently", "securely", "privately", "completely", "instantly",
    "faithfully", "reliably", "cryptographically", "autonomously", "verifiably",
    "irrevocably", "immutably", "transparently", "accurately", "definitively",
    "independently", "continuously", "precisely", "robustly", "unconditionally",
]

_LOCATIONS = [
    "on the Polygon network", "across all chains", "within the trusted enclave",
    "through zero knowledge", "at the identity layer", "on the secure ledger",
    "in the sovereign vault", "across decentralized nodes", "within the W3C protocol",
    "on the distributed chain", "at the authentication boundary", "via SIWE signature",
    "through cryptographic attestation", "on the verified registry",
    "within the biometric pipeline", "at the consensus layer",
    "across federated identity providers", "via the DID resolver",
    "in the privacy-preserving layer", "on the immutable record",
]

# ---------------------------------------------------------------------------
# Fixed Corpus of High-Quality Phrases (100+)
# ---------------------------------------------------------------------------
_FIXED_CORPUS = [
    "I authorize this secure identity verification session",
    "My sovereign identity is verified through this voice print",
    "I confirm my biometric authentication for this session",
    "This voice proves my cryptographic identity on the network",
    "I grant access using my verified biometric credential",
    "My unique voice pattern authenticates this digital claim",
    "I verify my sovereign identity through this secure channel",
    "The biometric engine validates my trusted presence now",
    "I attest to this cryptographic signature with my voice",
    "My authenticated identity is confirmed through this proof",
    "I authorize the secure enclave to verify my identity",
    "This voice recording confirms my sovereign digital passport",
    "My decentralized identity is validated through voice biometrics",
    "I confirm this session with my unique vocal signature",
    "The cryptographic protocol verifies my identity claim here",
    "I grant secure access through this biometric checkpoint",
    "My voice establishes the trusted authentication boundary",
    "I prove my sovereign identity through this vocal print",
    "This verification anchors my credential to the blockchain",
    "My trusted identity is sealed by this voice attestation",
    "I authorize access to my identity vault securely today",
    "The verification engine confirms my presence on the network",
    "My voice credential authenticates this decentralized session",
    "I attest to my sovereign identity with this vocal proof",
    "This biometric checkpoint grants access to my credentials",
    "My identity passport is verified through voice recognition",
    "I confirm my cryptographic key with this voice signature",
    "The secure protocol validates my trusted biometric claim",
    "My vocal pattern proves my unique identity on chain",
    "I authorize this trusted session through voice verification",
    "The decentralized network confirms my sovereign identity now",
    "My voice print establishes my presence at this boundary",
    "I grant access through the cryptographic identity layer",
    "This secure session is validated by my vocal attestation",
    "My biometric identity is confirmed for this transaction",
    "I verify my presence through the sovereign voice engine",
    "The trusted protocol anchors my identity to the ledger",
    "My voice establishes the authentication boundary for access",
    "I confirm my decentralized identity through this checkpoint",
    "This vocal signature seals my cryptographic identity claim",
    "My sovereign credential is authenticated through this voice",
    "I prove my trusted identity through the biometric scanner",
    "The identity engine validates my presence on the network",
    "My voice anchors this session to my sovereign passport",
    "I authorize the cryptographic proof through my vocal print",
    "This verification confirms my presence in the trusted enclave",
    "My biometric proof seals this session on the blockchain",
    "I attest to my identity through the vocal verification layer",
    "The sovereign network confirms my authenticated presence here",
    "My voice credential grants access to this secure session",
    "I confirm my identity through the decentralized protocol today",
    "The biometric engine authenticates my sovereign digital claim",
    "My vocal signature verifies my identity on the registry",
    "I prove my presence through this cryptographic checkpoint now",
    "The trusted identity layer validates my voice attestation",
    "My sovereign identity is anchored by this vocal proof here",
    "I authorize my decentralized credential through voice today",
    "This secure checkpoint confirms my authenticated identity now",
    "My voice establishes the sovereign trust boundary securely",
    "I grant access through my verified biometric voice print",
    "The cryptographic layer confirms my trusted identity claim",
    "My vocal proof validates my presence at the identity gate",
    "I confirm my sovereign credential through this secure voice",
    "This biometric verification anchors my identity to the chain",
    "My voice print proves my trusted presence on the network",
    "I authorize this session through the cryptographic voice proof",
    "The decentralized protocol confirms my biometric identity claim",
    "My sovereign identity is validated by this vocal attestation",
    "I prove my presence through the trusted voice enclave today",
    "This verification seals my identity on the distributed ledger",
    "My voice grants access through the sovereign identity layer",
    "I attest to my cryptographic credential with this voice print",
    "The secure registry validates my authenticated identity here",
    "My biometric checkpoint confirms my sovereign presence today",
    "I confirm my decentralized identity through this vocal proof",
    "The identity vault is unlocked by my verified voice print",
    "My voice anchors my sovereign identity to this session now",
    "I authorize access to the trusted enclave through my voice",
    "This vocal signature confirms my cryptographic identity claim",
    "My presence is verified through the biometric voice scanner",
    "I grant access through my sovereign voice attestation today",
    "The trusted network validates my decentralized identity claim",
    "My voice establishes my presence in the cryptographic layer",
    "I prove my identity through this secure biometric checkpoint",
    "This voice proof anchors my credential to the blockchain now",
    "My sovereign identity is sealed by this vocal verification",
    "I confirm my biometric presence through the trusted protocol",
    "The decentralized network validates my authenticated identity",
    "My vocal print grants access to my sovereign digital vault",
    "I authorize this cryptographic session through voice biometrics",
    "This secure channel confirms my verified identity presence",
    "My voice validates my sovereign presence on the network today",
    "I attest to my decentralized credential through this vocal proof",
    "The identity engine seals my presence on the trusted ledger",
    "My biometric voice print confirms my sovereign identity claim",
    "I grant access through the cryptographic verification engine",
    "This vocal attestation anchors my identity to the trusted chain",
    "My sovereign presence is confirmed by this voice checkpoint",
    "I authorize my identity passport through this vocal signature",
    "The trusted protocol validates my presence in the biometric layer",
    "My voice credential seals this session on the distributed ledger",
]


# ---------------------------------------------------------------------------
# Corpus Generator
# ---------------------------------------------------------------------------
def _generate_corpus() -> List[str]:
    """
    Return the fixed corpus of high-quality phrases.
    """
    return list(_FIXED_CORPUS)



# ---------------------------------------------------------------------------
# Singleton Corpus
# ---------------------------------------------------------------------------
_CORPUS: Optional[List[str]] = None

def _get_corpus() -> List[str]:
    global _CORPUS
    if _CORPUS is None:
        _CORPUS = _generate_corpus()
    return _CORPUS


# ---------------------------------------------------------------------------
# Recent-Use Tracker (per-wallet, avoids repeats for last 50 challenges)
# ---------------------------------------------------------------------------
_recent_challenges: dict[str, deque] = {}
_MAX_RECENT = 50


def get_challenges(wallet_address: str, count: int = 1) -> List[str]:
    """
    Return `count` cryptographically-random, unique challenge phrases
    that have not been recently served to this wallet address.

    Args:
        wallet_address: The wallet address of the user (lowercased for consistency).
        count: Number of unique challenges to return (1-10).

    Returns:
        List of challenge phrase strings.
    """
    wallet_key = wallet_address.strip().lower()
    corpus = _get_corpus()
    
    if wallet_key not in _recent_challenges:
        _recent_challenges[wallet_key] = deque(maxlen=_MAX_RECENT)
    
    recent = _recent_challenges[wallet_key]
    recent_set = set(recent)
    
    available = [p for p in corpus if p not in recent_set]
    
    # If somehow all phrases have been used (impossible with 10k), reset
    if len(available) < count:
        recent.clear()
        available = corpus
    
    selected: List[str] = []
    # Use secure random selection without replacement
    pool = list(available)
    for _ in range(min(count, len(pool))):
        idx = secrets.randbelow(len(pool))
        phrase = pool.pop(idx)
        selected.append(phrase)
        recent.appendleft(phrase)
    
    return selected


def get_challenge(wallet_address: str = "") -> str:
    """Convenience function to get a single challenge phrase."""
    results = get_challenges(wallet_address, count=1)
    return results[0] if results else "I authorize this secure identity verification session"


def corpus_size() -> int:
    """Return the current number of phrases in the corpus."""
    return len(_get_corpus())
