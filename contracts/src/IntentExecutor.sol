// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AgentWallet.sol";
import "./interfaces/IUniswapV2.sol";

/// @title IntentExecutor — Routes AI-parsed intents to real on-chain actions
/// @notice Called by the backend agent to execute validated user intents
contract IntentExecutor {
    address public immutable router;
    address public immutable wpas;
    address public admin;

    // Token registry: symbol hash → token address
    mapping(bytes32 => address) public tokenRegistry;
    string[] public registeredSymbols;

    event IntentExecuted(
        address indexed wallet,
        string intentType,
        bytes params,
        bool success
    );
    event TokenRegistered(string symbol, address token);

    modifier onlyAdmin() {
        require(msg.sender == admin, "IntentExecutor: not admin");
        _;
    }

    constructor(address _router, address _wpas) {
        router = _router;
        wpas = _wpas;
        admin = msg.sender;
    }

    // ═══════════════════════════════════════════
    //  Admin — Token Registry
    // ═══════════════════════════════════════════

    function registerToken(string calldata symbol, address token) external onlyAdmin {
        bytes32 key = keccak256(abi.encodePacked(symbol));
        if (tokenRegistry[key] == address(0)) {
            registeredSymbols.push(symbol);
        }
        tokenRegistry[key] = token;
        emit TokenRegistered(symbol, token);
    }

    function getToken(string calldata symbol) external view returns (address) {
        return tokenRegistry[keccak256(abi.encodePacked(symbol))];
    }

    // ═══════════════════════════════════════════
    //  Intent Actions
    // ═══════════════════════════════════════════

    /// @notice Execute a native PAS transfer from an AgentWallet
    function executeTransferNative(
        AgentWallet wallet,
        address to,
        uint256 amount
    ) external {
        bytes memory data = "";
        wallet.executeCall(to, amount, data);
        emit IntentExecuted(address(wallet), "TRANSFER_NATIVE", abi.encode(to, amount), true);
    }

    /// @notice Execute an ERC-20 token transfer from an AgentWallet
    function executeTransferToken(
        AgentWallet wallet,
        address token,
        address to,
        uint256 amount
    ) external {
        wallet.executeTokenTransfer(token, to, amount);
        emit IntentExecuted(address(wallet), "TRANSFER_TOKEN", abi.encode(token, to, amount), true);
    }

    /// @notice Swap native PAS for tokens via Uniswap V2
    function executeSwapExactPASForTokens(
        AgentWallet wallet,
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenOut,
        uint256 deadline
    ) external {
        // Approve WPAS for router via wallet
        address[] memory path = new address[](2);
        path[0] = wpas;
        path[1] = tokenOut;

        // Call router.swapExactETHForTokens via wallet
        bytes memory data = abi.encodeWithSelector(
            IUniswapV2Router02.swapExactETHForTokens.selector,
            amountOutMin,
            path,
            address(wallet),
            deadline
        );
        wallet.executeCall(router, amountIn, data);

        emit IntentExecuted(
            address(wallet),
            "SWAP_PAS_FOR_TOKENS",
            abi.encode(amountIn, tokenOut, amountOutMin),
            true
        );
    }

    /// @notice Swap tokens for native PAS via Uniswap V2
    function executeSwapExactTokensForPAS(
        AgentWallet wallet,
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external {
        // Approve token spending
        wallet.executeTokenApprove(tokenIn, router, amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = wpas;

        bytes memory data = abi.encodeWithSelector(
            IUniswapV2Router02.swapExactTokensForETH.selector,
            amountIn,
            amountOutMin,
            path,
            address(wallet),
            deadline
        );
        wallet.executeCall(router, 0, data);

        emit IntentExecuted(
            address(wallet),
            "SWAP_TOKENS_FOR_PAS",
            abi.encode(tokenIn, amountIn, amountOutMin),
            true
        );
    }

    /// @notice Swap tokens for tokens via Uniswap V2
    function executeSwapExactTokensForTokens(
        AgentWallet wallet,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external {
        wallet.executeTokenApprove(tokenIn, router, amountIn);

        address[] memory path = new address[](3);
        path[0] = tokenIn;
        path[1] = wpas;
        path[2] = tokenOut;

        bytes memory data = abi.encodeWithSelector(
            IUniswapV2Router02.swapExactTokensForTokens.selector,
            amountIn,
            amountOutMin,
            path,
            address(wallet),
            deadline
        );
        wallet.executeCall(router, 0, data);

        emit IntentExecuted(
            address(wallet),
            "SWAP_TOKENS",
            abi.encode(tokenIn, tokenOut, amountIn, amountOutMin),
            true
        );
    }

    /// @notice Add liquidity with native PAS + token
    function executeAddLiquidityPAS(
        AgentWallet wallet,
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountPASMin,
        uint256 amountPAS,
        uint256 deadline
    ) external {
        wallet.executeTokenApprove(token, router, amountTokenDesired);

        bytes memory data = abi.encodeWithSelector(
            IUniswapV2Router02.addLiquidityETH.selector,
            token,
            amountTokenDesired,
            amountTokenMin,
            amountPASMin,
            address(wallet),
            deadline
        );
        wallet.executeCall(router, amountPAS, data);

        emit IntentExecuted(
            address(wallet),
            "ADD_LIQUIDITY_PAS",
            abi.encode(token, amountTokenDesired, amountPAS),
            true
        );
    }

    /// @notice Remove liquidity for PAS + token
    function executeRemoveLiquidityPAS(
        AgentWallet wallet,
        address token,
        address pair,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountPASMin,
        uint256 deadline
    ) external {
        wallet.executeTokenApprove(pair, router, liquidity);

        bytes memory data = abi.encodeWithSelector(
            IUniswapV2Router02.removeLiquidityETH.selector,
            token,
            liquidity,
            amountTokenMin,
            amountPASMin,
            address(wallet),
            deadline
        );
        wallet.executeCall(router, 0, data);

        emit IntentExecuted(
            address(wallet),
            "REMOVE_LIQUIDITY_PAS",
            abi.encode(token, liquidity),
            true
        );
    }

    // ═══════════════════════════════════════════
    //  View — Quotes
    // ═══════════════════════════════════════════

    function getSwapQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        address[] memory path;
        if (tokenIn == wpas || tokenOut == wpas) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        } else {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = wpas;
            path[2] = tokenOut;
        }
        uint[] memory amounts = IUniswapV2Router02(router).getAmountsOut(amountIn, path);
        return amounts[amounts.length - 1];
    }

    function getPoolInfo(address tokenA, address tokenB)
        external
        view
        returns (uint112 reserveA, uint112 reserveB, uint256 totalSupply)
    {
        address pair = IUniswapV2Factory(IUniswapV2Router02(router).factory()).getPair(tokenA, tokenB);
        require(pair != address(0), "IntentExecutor: pair not found");
        (reserveA, reserveB,) = IUniswapV2Pair(pair).getReserves();
        totalSupply = IUniswapV2Pair(pair).totalSupply();
    }
}
