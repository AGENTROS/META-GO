// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Mock Groth16 verifier for development. Replace with snarkjs-generated
/// verifier.sol for production.
contract Groth16Verifier {
    function verifyProof(
        uint256[2] calldata _a,
        uint256[2][2] calldata _b,
        uint256[2] calldata _c,
        uint256[4] calldata _input
    ) external pure returns (bool) {
        // Production: replace with actual pairing checks emitted by snarkjs.
        // This mock validates the public inputs are non-zero so circuit compile
        // pipeline can be wired without committing real verification keys.
        return _input[0] != 0 && _input[1] != 0;
    }
}
