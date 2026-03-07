// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockToken — Test ERC-20 for Polkadot Hub testnet
/// @notice Used when native USDT/USDC precompiles are unavailable on Paseo testnet
contract MockToken is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet(uint256 amount) external {
        require(amount <= 10000 * 10 ** _decimals, "MockToken: max 10000 per faucet");
        _mint(msg.sender, amount);
    }
}
