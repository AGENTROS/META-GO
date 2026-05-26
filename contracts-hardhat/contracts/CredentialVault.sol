// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CredentialVault {
    struct Credential {
        string vcType;
        bytes32 vcHash;
        string ipfsURI;
        uint64 issuedAt;
        bool revoked;
        address issuer;
    }

    mapping(address => mapping(bytes32 => Credential)) public vault;

    event CredentialIssued(address indexed holder, bytes32 indexed vcId, address indexed issuer);
    event CredentialRevoked(address indexed holder, bytes32 indexed vcId);

    function issueCredential(
        address holder,
        bytes32 vcId,
        string calldata vcType,
        bytes32 vcHash,
        string calldata ipfsURI
    ) external {
        vault[holder][vcId] = Credential({
            vcType: vcType,
            vcHash: vcHash,
            ipfsURI: ipfsURI,
            issuedAt: uint64(block.timestamp),
            revoked: false,
            issuer: msg.sender
        });
        emit CredentialIssued(holder, vcId, msg.sender);
    }

    function revokeCredential(address holder, bytes32 vcId) external {
        require(vault[holder][vcId].issuer == msg.sender, "Only issuer can revoke");
        vault[holder][vcId].revoked = true;
        emit CredentialRevoked(holder, vcId);
    }
}
