// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata _a,
        uint256[2][2] calldata _b,
        uint256[2] calldata _c,
        uint256[4] calldata _input
    ) external view returns (bool);
}

/// @notice Identity registry that anchors a DID + handle + ZK proof to a wallet, handles on-chain social recovery, and multi-chain sync.
contract IdentityRegistry is 
    Initializable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct Identity {
        string handle;
        string did;
        bytes32 proofHash;
        uint64 timestamp;
        bool active;
    }

    struct SocialRecoveryConfig {
        address[] guardians;
        bytes32 passphraseHash;
        bool active;
    }

    struct RecoverySession {
        address newWallet;
        string newDid;
        bool active;
        address[] approvals;
    }

    IGroth16Verifier public verifier;
    address public relayerAddress; // Deprecated but kept for ABI backward compatibility
    
    mapping(address => Identity) public identities;
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(string => address) public handleOwners;
    mapping(string => address) public didOwners;

    // Social recovery state
    mapping(address => SocialRecoveryConfig) public recoveryConfigs;
    mapping(address => RecoverySession) public recoverySessions;
    mapping(address => mapping(address => bool)) public hasApproved;

    event IdentityRegistered(address indexed wallet, string did, string handle);
    event IdentityUpdated(address indexed wallet, bytes32 newProofHash);
    event CrossChainSyncInitiated(uint64 indexed destinationChainSelector, address indexed wallet, string did, string handle);
    
    event SocialRecoverySetup(address indexed wallet, address[] guardians, bytes32 passphraseHash);
    event RecoverySessionInitiated(address indexed wallet, address indexed newWallet, bytes32 passphraseHash);
    event RecoveryApproved(address indexed wallet, address indexed guardian);
    event RecoveryExecuted(address indexed oldWallet, address indexed newWallet);

    // Custom errors for gas optimization and safety
    error AlreadyRegistered();
    error HandleTaken();
    error DIDTaken();
    error NullifierUsed();
    error InvalidZKProof();
    error NotRelayer();
    error SocialRecoveryNotConfigured();
    error InvalidPassphraseHash();
    error InvalidNewWallet();
    error NoActiveRecoverySession();
    error SenderNotGuardian();
    error GuardianAlreadyApproved();
    error IdentityNotActive();
    error LengthMismatch();
    error InvalidGuardianCount();
    error NotGuardian();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _verifier, address _relayer) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, _relayer);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        verifier = IGroth16Verifier(_verifier);
        relayerAddress = _relayer;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function registerIdentity(
        string calldata _handle,
        string calldata _did,
        bytes32 _proofHash,
        bytes32 _nullifier,
        uint256[2] calldata _a,
        uint256[2][2] calldata _b,
        uint256[2] calldata _c,
        uint256[4] calldata _input
    ) external whenNotPaused nonReentrant {
        if (identities[msg.sender].active) revert AlreadyRegistered();
        if (handleOwners[_handle] != address(0)) revert HandleTaken();
        if (didOwners[_did] != address(0)) revert DIDTaken();
        if (usedNullifiers[_nullifier]) revert NullifierUsed();
        if (!verifier.verifyProof(_a, _b, _c, _input)) revert InvalidZKProof();

        identities[msg.sender] = Identity({
            handle: _handle,
            did: _did,
            proofHash: _proofHash,
            timestamp: uint64(block.timestamp),
            active: true
        });
        handleOwners[_handle] = msg.sender;
        didOwners[_did] = msg.sender;
        usedNullifiers[_nullifier] = true;
        
        emit IdentityRegistered(msg.sender, _did, _handle);
    }

    function registerCrossChain(
        address _wallet,
        string calldata _handle,
        string calldata _did
    ) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (handleOwners[_handle] != address(0)) revert HandleTaken();
        if (didOwners[_did] != address(0)) revert DIDTaken();

        identities[_wallet] = Identity({
            handle: _handle,
            did: _did,
            proofHash: bytes32(0),
            timestamp: uint64(block.timestamp),
            active: true
        });
        handleOwners[_handle] = _wallet;
        didOwners[_did] = _wallet;
        
        emit IdentityRegistered(_wallet, _did, _handle);
    }

    function isRegistered(address wallet) external view returns (bool) {
        return identities[wallet].active;
    }

    function syncCrossChain(uint64 _destinationChainSelector) external whenNotPaused {
        if (!identities[msg.sender].active) revert IdentityNotActive();
        emit CrossChainSyncInitiated(_destinationChainSelector, msg.sender, identities[msg.sender].did, identities[msg.sender].handle);
    }

    function syncCrossChainFor(address _user, uint64 _destinationChainSelector) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (!identities[_user].active) revert IdentityNotActive();
        emit CrossChainSyncInitiated(_destinationChainSelector, _user, identities[_user].did, identities[_user].handle);
    }

    // Social Recovery implementation
    function setupRecovery(address[] calldata _guardians, bytes32 _passphraseHash) external whenNotPaused {
        if (_guardians.length < 3) revert InvalidGuardianCount();
        
        for (uint256 i = 0; i < _guardians.length; i++) {
            if (_guardians[i] == address(0)) revert InvalidNewWallet();
            if (_guardians[i] == msg.sender) revert NotGuardian();
            for (uint256 j = 0; j < i; j++) {
                if (_guardians[i] == _guardians[j]) revert InvalidNewWallet();
            }
        }

        SocialRecoveryConfig storage config = recoveryConfigs[msg.sender];
        config.guardians = _guardians;
        config.passphraseHash = _passphraseHash;
        config.active = true;
        
        emit SocialRecoverySetup(msg.sender, _guardians, _passphraseHash);
    }

    function initiateRecovery(address _oldWallet, bytes32 _passphraseHash, address _newWallet, string calldata _newDid) external whenNotPaused {
        SocialRecoveryConfig memory config = recoveryConfigs[_oldWallet];
        if (!config.active) revert SocialRecoveryNotConfigured();
        if (config.passphraseHash != _passphraseHash) revert InvalidPassphraseHash();
        if (_newWallet == address(0)) revert InvalidNewWallet();

        RecoverySession storage session = recoverySessions[_oldWallet];
        session.newWallet = _newWallet;
        session.newDid = _newDid;
        session.active = true;
        delete session.approvals;

        for (uint256 i = 0; i < config.guardians.length; i++) {
            hasApproved[_oldWallet][config.guardians[i]] = false;
        }

        emit RecoverySessionInitiated(_oldWallet, _newWallet, _passphraseHash);
    }

    function approveRecovery(address _targetIdentity) external whenNotPaused nonReentrant {
        RecoverySession storage session = recoverySessions[_targetIdentity];
        if (!session.active) revert NoActiveRecoverySession();

        SocialRecoveryConfig memory config = recoveryConfigs[_targetIdentity];
        bool isGuardian = false;
        for (uint256 i = 0; i < config.guardians.length; i++) {
            if (config.guardians[i] == msg.sender) {
                isGuardian = true;
                break;
            }
        }
        if (!isGuardian) revert SenderNotGuardian();
        if (hasApproved[_targetIdentity][msg.sender]) revert GuardianAlreadyApproved();

        hasApproved[_targetIdentity][msg.sender] = true;
        session.approvals.push(msg.sender);

        emit RecoveryApproved(_targetIdentity, msg.sender);

        // 2/3 guardians needed for consensus
        if (session.approvals.length >= 2) {
            address newWallet = session.newWallet;
            Identity memory id = identities[_targetIdentity];
            if (!id.active) revert IdentityNotActive();

            // Revoke old mappings
            delete identities[_targetIdentity];
            delete didOwners[id.did];
            
            // Assign identity to the new wallet
            identities[newWallet] = Identity({
                handle: id.handle,
                did: session.newDid,
                proofHash: id.proofHash,
                timestamp: uint64(block.timestamp),
                active: true
            });
            
            // Re-map handle & did ownership
            handleOwners[id.handle] = newWallet;
            didOwners[session.newDid] = newWallet;

            // Mark session as complete / inactive
            session.active = false;

            emit RecoveryExecuted(_targetIdentity, newWallet);
        }
    }

    // Helper to check guardians
    function getGuardians(address wallet) external view returns (address[] memory) {
        return recoveryConfigs[wallet].guardians;
    }

    // Helper to check approvals
    function getRecoveryApprovals(address wallet) external view returns (address[] memory) {
        return recoverySessions[wallet].approvals;
    }
}
