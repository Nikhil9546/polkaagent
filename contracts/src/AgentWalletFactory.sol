// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AgentWallet.sol";

/// @title AgentWalletFactory — Deploys AgentWallet instances per user
contract AgentWalletFactory {
    mapping(address => address) public wallets;
    address[] public allWallets;

    event WalletCreated(address indexed owner, address indexed wallet, address agent);

    function createWallet(address agent) external returns (address) {
        require(wallets[msg.sender] == address(0), "Factory: wallet exists");

        AgentWallet wallet = new AgentWallet(msg.sender, agent);
        wallets[msg.sender] = address(wallet);
        allWallets.push(address(wallet));

        emit WalletCreated(msg.sender, address(wallet), agent);
        return address(wallet);
    }

    function getWallet(address owner) external view returns (address) {
        return wallets[owner];
    }

    function totalWallets() external view returns (uint256) {
        return allWallets.length;
    }
}
