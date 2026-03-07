// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title AgentWallet — AI-delegated smart wallet for PolkaAgent
/// @notice Users deposit funds and authorize an AI agent to execute actions within spending limits
contract AgentWallet is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public agent;
    bool public paused;

    // Daily spending limits per token (address(0) = native PAS)
    mapping(address => uint256) public dailyLimit;
    mapping(address => uint256) public dailySpent;
    mapping(address => uint256) public lastResetTime;

    // Allowlisted contracts the agent can interact with
    mapping(address => bool) public allowlistedTargets;

    event Deposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount, address indexed to);
    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);
    event AgentExecuted(address indexed target, uint256 value, bytes data, bytes result);
    event DailyLimitSet(address indexed token, uint256 limit);
    event TargetAllowlisted(address indexed target, bool allowed);
    event Paused(bool isPaused);

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentWallet: not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agent, "AgentWallet: not agent");
        require(!paused, "AgentWallet: paused");
        _;
    }

    modifier onlyOwnerOrAgent() {
        require(msg.sender == owner || msg.sender == agent, "AgentWallet: unauthorized");
        _;
    }

    constructor(address _owner, address _agent) {
        owner = _owner;
        agent = _agent;
    }

    receive() external payable {
        emit Deposited(address(0), msg.value);
    }

    // ═══════════════════════════════════════════
    //  Owner Functions
    // ═══════════════════════════════════════════

    function authorizeAgent(address _agent) external onlyOwner {
        agent = _agent;
        emit AgentAuthorized(_agent);
    }

    function revokeAgent() external onlyOwner {
        emit AgentRevoked(agent);
        agent = address(0);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function setDailyLimit(address token, uint256 limit) external onlyOwner {
        dailyLimit[token] = limit;
        emit DailyLimitSet(token, limit);
    }

    function setTargetAllowlist(address target, bool allowed) external onlyOwner {
        allowlistedTargets[target] = allowed;
        emit TargetAllowlisted(target, allowed);
    }

    function withdraw(address token, uint256 amount, address to) external onlyOwner nonReentrant {
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
        emit Withdrawn(token, amount, to);
    }

    // ═══════════════════════════════════════════
    //  Agent Functions
    // ═══════════════════════════════════════════

    function executeCall(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyAgent nonReentrant returns (bytes memory) {
        require(allowlistedTargets[target], "AgentWallet: target not allowlisted");

        // Check and update daily spending limit for native token
        if (value > 0) {
            _checkAndUpdateLimit(address(0), value);
        }

        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "AgentWallet: call failed");

        emit AgentExecuted(target, value, data, result);
        return result;
    }

    function executeTokenTransfer(
        address token,
        address to,
        uint256 amount
    ) external onlyAgent nonReentrant {
        _checkAndUpdateLimit(token, amount);
        IERC20(token).safeTransfer(to, amount);
        emit AgentExecuted(to, 0, abi.encodeWithSelector(IERC20.transfer.selector, to, amount), "");
    }

    function executeTokenApprove(
        address token,
        address spender,
        uint256 amount
    ) external onlyAgent nonReentrant {
        require(allowlistedTargets[spender], "AgentWallet: spender not allowlisted");
        IERC20(token).forceApprove(spender, amount);
    }

    // ═══════════════════════════════════════════
    //  View Functions
    // ═══════════════════════════════════════════

    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getRemainingDailyLimit(address token) external view returns (uint256) {
        uint256 limit = dailyLimit[token];
        if (limit == 0) return type(uint256).max; // no limit set
        uint256 spent = dailySpent[token];
        if (block.timestamp >= lastResetTime[token] + 1 days) {
            return limit;
        }
        return limit > spent ? limit - spent : 0;
    }

    // ═══════════════════════════════════════════
    //  Internal
    // ═══════════════════════════════════════════

    function _checkAndUpdateLimit(address token, uint256 amount) internal {
        uint256 limit = dailyLimit[token];
        if (limit == 0) return; // no limit = unlimited

        if (block.timestamp >= lastResetTime[token] + 1 days) {
            dailySpent[token] = 0;
            lastResetTime[token] = block.timestamp;
        }

        dailySpent[token] += amount;
        require(dailySpent[token] <= limit, "AgentWallet: daily limit exceeded");
    }
}
