// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IXcm.sol";
import "./AgentWallet.sol";

/// @title XCMExecutor — Cross-chain asset transfers via Polkadot XCM precompile
/// @notice Enables AI agent to move assets across parachains for arbitrage
contract XCMExecutor {
    IXcm public constant xcm = IXcm(XCM_PRECOMPILE_ADDRESS);
    address public admin;

    // Parachain registry
    struct ParachainInfo {
        uint32 paraId;
        string name;
        bool active;
    }

    mapping(uint32 => ParachainInfo) public parachains;
    uint32[] public registeredParaIds;

    event XCMTransferInitiated(
        address indexed wallet,
        uint32 indexed destParaId,
        address indexed beneficiary,
        uint256 amount,
        bytes xcmMessage
    );
    event XCMMessageSent(
        uint32 indexed destParaId,
        bytes message
    );
    event ParachainRegistered(uint32 paraId, string name);

    modifier onlyAdmin() {
        require(msg.sender == admin, "XCMExecutor: not admin");
        _;
    }

    constructor() {
        admin = msg.sender;

        // Register known parachains
        _registerParachain(1000, "Asset Hub");
        _registerParachain(2000, "Acala");
        _registerParachain(2004, "Moonbeam");
        _registerParachain(2006, "Astar");
        _registerParachain(2030, "Bifrost");
        _registerParachain(2034, "Hydration");
    }

    // ═══════════════════════════════════════════
    //  Admin
    // ═══════════════════════════════════════════

    function registerParachain(uint32 paraId, string calldata name) external onlyAdmin {
        _registerParachain(paraId, name);
    }

    // ═══════════════════════════════════════════
    //  XCM Operations
    // ═══════════════════════════════════════════

    /// @notice Execute an XCM message locally (for transfers from this chain)
    function executeXCM(bytes calldata message) external {
        IXcm.Weight memory weight = xcm.weighMessage(message);
        xcm.execute(message, weight);
    }

    /// @notice Send an XCM message to a destination parachain
    function sendXCM(bytes calldata destination, bytes calldata message) external {
        xcm.send(destination, message);
    }

    /// @notice Execute XCM transfer via an AgentWallet
    /// @dev The agent calls this to move assets cross-chain from a user's wallet
    function executeXCMTransfer(
        AgentWallet wallet,
        uint32 destParaId,
        address beneficiary,
        uint256 amount,
        bytes calldata xcmMessage
    ) external {
        require(parachains[destParaId].active, "XCMExecutor: unknown parachain");

        // Execute XCM via the wallet (wallet must have this contract allowlisted)
        wallet.executeCall(
            XCM_PRECOMPILE_ADDRESS,
            0,
            xcmMessage
        );

        emit XCMTransferInitiated(
            address(wallet),
            destParaId,
            beneficiary,
            amount,
            xcmMessage
        );
    }

    /// @notice Get XCM weight estimate for a message
    function estimateWeight(bytes calldata message) external view returns (uint64 refTime, uint64 proofSize) {
        IXcm.Weight memory weight = xcm.weighMessage(message);
        return (weight.refTime, weight.proofSize);
    }

    // ═══════════════════════════════════════════
    //  View
    // ═══════════════════════════════════════════

    function getParachain(uint32 paraId) external view returns (string memory name, bool active) {
        ParachainInfo memory info = parachains[paraId];
        return (info.name, info.active);
    }

    function getAllParachains() external view returns (uint32[] memory) {
        return registeredParaIds;
    }

    function getParachainCount() external view returns (uint256) {
        return registeredParaIds.length;
    }

    // ═══════════════════════════════════════════
    //  Internal
    // ═══════════════════════════════════════════

    function _registerParachain(uint32 paraId, string memory name) internal {
        if (!parachains[paraId].active) {
            registeredParaIds.push(paraId);
        }
        parachains[paraId] = ParachainInfo({
            paraId: paraId,
            name: name,
            active: true
        });
        emit ParachainRegistered(paraId, name);
    }
}
