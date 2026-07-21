// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

/// @notice Soulbound Token — non-transferable ERC-721 conforming to ERC-5192.
contract CelestialSBT is ERC721, Ownable, IERC5192 {
    uint256 private _nextTokenId = 1;

    mapping(uint256 => string) public domainOf;
    mapping(uint256 => bool) public revoked;
    mapping(uint256 => string) private _tokenURIs;

    event Minted(address indexed to, uint256 indexed tokenId, string domain);
    event Revoked(uint256 indexed tokenId);

    constructor() ERC721("Meta Go Sovereign ID", "MGSID") Ownable(msg.sender) {}

    function mint(address to, string calldata domain, string calldata uri) external onlyOwner returns (uint256) {
        require(to != address(0), "Mint to zero");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        domainOf[tokenId] = domain;
        _tokenURIs[tokenId] = uri;
        
        emit Minted(to, tokenId, domain);
        emit Locked(tokenId);
        return tokenId;
    }

    function revoke(uint256 tokenId) external onlyOwner {
        _requireOwned(tokenId);
        revoked[tokenId] = true;
        emit Revoked(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    /// @dev ERC-5192 locked status check.
    function locked(uint256 tokenId) external view override returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    /// @dev Block transfers at the hook level.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("SOULBOUND: transfer disabled");
        }
        return super._update(to, tokenId, auth);
    }

    // Disable approvals as well to conform strictly to zero-trust soulbinding
    function approve(address, uint256) public pure override {
        revert("SOULBOUND: approval disabled");
    }
    function setApprovalForAll(address, bool) public pure override {
        revert("SOULBOUND: approval disabled");
    }
}
