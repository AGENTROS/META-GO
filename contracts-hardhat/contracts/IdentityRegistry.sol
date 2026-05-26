// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata _a,
        uint256[2][2] calldata _b,
        uint256[2] calldata _c,
        uint256[4] calldata _input
    ) external view returns (bool);
}

/// @notice Identity registry that anchors a DID + handle + ZK proof to a wallet.
contract IdentityRegistry {
    struct Identity {
        string handle;
        string did;
        bytes32 proofHash;
        uint64 timestamp;
        bool active;
    }

    IGroth16Verifier public immutable verifier;
    mapping(address => Identity) public identities;
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(string => address) public handleOwners;

    event IdentityRegistered(address indexed wallet, string did, string handle);
    event IdentityUpdated(address indexed wallet, bytes32 newProofHash);

    constructor(address _verifier) {
        verifier = IGroth16Verifier(_verifier);
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
    ) external {
        require(!identities[msg.sender].active, "Already registered");
        require(handleOwners[_handle] == address(0), "Handle taken");
        require(!usedNullifiers[_nullifier], "Nullifier used");
        require(verifier.verifyProof(_a, _b, _c, _input), "Invalid ZK proof");

        identities[msg.sender] = Identity({
            handle: _handle,
            did: _did,
            proofHash: _proofHash,
            timestamp: uint64(block.timestamp),
            active: true
        });
        handleOwners[_handle] = msg.sender;
        usedNullifiers[_nullifier] = true;
        emit IdentityRegistered(msg.sender, _did, _handle);
    }

    function isRegistered(address wallet) external view returns (bool) {
        return identities[wallet].active;
    }
}
