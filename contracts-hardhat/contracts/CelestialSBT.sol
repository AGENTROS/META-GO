// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Soulbound Token — non-transferable ERC-721. Override _update to block transfers.
contract CelestialSBT {
    string public name = "Meta Go Sovereign ID";
    string public symbol = "MGSID";
    uint256 private _nextTokenId = 1;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => string) public domainOf;
    mapping(uint256 => bool) public revoked;
    mapping(uint256 => string) public tokenURIs;

    event Minted(address indexed to, uint256 indexed tokenId, string domain);
    event Revoked(uint256 indexed tokenId);

    function mint(address to, string calldata domain, string calldata uri) external returns (uint256) {
        require(to != address(0), "Mint to zero");
        uint256 tokenId = _nextTokenId++;
        ownerOf[tokenId] = to;
        balanceOf[to]++;
        domainOf[tokenId] = domain;
        tokenURIs[tokenId] = uri;
        emit Minted(to, tokenId, domain);
        return tokenId;
    }

    function revoke(uint256 tokenId) external {
        require(ownerOf[tokenId] != address(0), "Token not found");
        revoked[tokenId] = true;
        emit Revoked(tokenId);
    }

    /// @notice Soulbinding — transfer is permanently disabled at protocol level.
    function transferFrom(address, address, uint256) external pure {
        revert("SOULBOUND: transfer disabled");
    }
    function safeTransferFrom(address, address, uint256) external pure {
        revert("SOULBOUND: transfer disabled");
    }
    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert("SOULBOUND: transfer disabled");
    }
    function approve(address, uint256) external pure {
        revert("SOULBOUND: approval disabled");
    }
    function setApprovalForAll(address, bool) external pure {
        revert("SOULBOUND: approval disabled");
    }
}
