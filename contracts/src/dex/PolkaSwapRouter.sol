// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../WPAS.sol";
import "./PolkaSwapFactory.sol";
import "./PolkaSwapPair.sol";

/// @title PolkaSwapRouter — Uniswap V2 style router for Polkadot Hub
contract PolkaSwapRouter {
    address public immutable factory;
    address public immutable WETH; // WPAS

    constructor(address _factory, address _weth) {
        factory = _factory;
        WETH = _weth;
    }

    receive() external payable {
        require(msg.sender == WETH, "Router: only WPAS");
    }

    // ═══════════════════════════════════════════
    //  Add Liquidity
    // ═══════════════════════════════════════════

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(block.timestamp <= deadline, "Router: EXPIRED");

        (amountA, amountB) = _calculateLiquidityAmounts(
            tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin
        );

        address pair = _getPairOrCreate(tokenA, tokenB);
        IERC20(tokenA).transferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountB);
        liquidity = PolkaSwapPair(pair).mint(to);
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        require(block.timestamp <= deadline, "Router: EXPIRED");

        (amountToken, amountETH) = _calculateLiquidityAmounts(
            token, WETH, amountTokenDesired, msg.value, amountTokenMin, amountETHMin
        );

        address pair = _getPairOrCreate(token, WETH);
        IERC20(token).transferFrom(msg.sender, pair, amountToken);
        WPAS(payable(WETH)).deposit{value: amountETH}();
        IERC20(WETH).transfer(pair, amountETH);
        liquidity = PolkaSwapPair(pair).mint(to);

        // Refund excess ETH
        if (msg.value > amountETH) {
            payable(msg.sender).transfer(msg.value - amountETH);
        }
    }

    // ═══════════════════════════════════════════
    //  Remove Liquidity
    // ═══════════════════════════════════════════

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public returns (uint256 amountA, uint256 amountB) {
        require(block.timestamp <= deadline, "Router: EXPIRED");

        address pair = PolkaSwapFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "Router: pair not found");

        IERC20(pair).transferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = PolkaSwapPair(pair).burn(to);

        (address token0,) = _sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, "Router: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "Router: INSUFFICIENT_B_AMOUNT");
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token, WETH, liquidity, amountTokenMin, amountETHMin, address(this), deadline
        );
        IERC20(token).transfer(to, amountToken);
        WPAS(payable(WETH)).withdraw(amountETH);
        payable(to).transfer(amountETH);
    }

    // ═══════════════════════════════════════════
    //  Swap
    // ═══════════════════════════════════════════

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(block.timestamp <= deadline, "Router: EXPIRED");
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
        IERC20(path[0]).transferFrom(msg.sender, _getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        require(block.timestamp <= deadline, "Router: EXPIRED");
        require(path[0] == WETH, "Router: INVALID_PATH");
        amounts = getAmountsOut(msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
        WPAS(payable(WETH)).deposit{value: amounts[0]}();
        IERC20(WETH).transfer(_getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(block.timestamp <= deadline, "Router: EXPIRED");
        require(path[path.length - 1] == WETH, "Router: INVALID_PATH");
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
        IERC20(path[0]).transferFrom(msg.sender, _getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        WPAS(payable(WETH)).withdraw(amounts[amounts.length - 1]);
        payable(to).transfer(amounts[amounts.length - 1]);
    }

    // ═══════════════════════════════════════════
    //  View — Quotes
    // ═══════════════════════════════════════════

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Router: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = _getReserves(path[i], path[i + 1]);
            amounts[i + 1] = _getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountsIn(uint256 amountOut, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Router: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = _getReserves(path[i - 1], path[i]);
            amounts[i - 1] = _getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }

    // ═══════════════════════════════════════════
    //  Internal
    // ═══════════════════════════════════════════

    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = _sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address to = i < path.length - 2 ? _getPair(output, path[i + 2]) : _to;
            PolkaSwapPair(_getPair(input, output)).swap(amount0Out, amount1Out, to);
        }
    }

    function _getPair(address tokenA, address tokenB) internal view returns (address) {
        address pair = PolkaSwapFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "Router: pair not found");
        return pair;
    }

    function _getPairOrCreate(address tokenA, address tokenB) internal returns (address) {
        address pair = PolkaSwapFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = PolkaSwapFactory(factory).createPair(tokenA, tokenB);
        }
        return pair;
    }

    function _getReserves(address tokenA, address tokenB) internal view returns (uint256 reserveA, uint256 reserveB) {
        (address token0,) = _sortTokens(tokenA, tokenB);
        address pair = PolkaSwapFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "Router: pair not found");
        (uint112 reserve0, uint112 reserve1,) = PolkaSwapPair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (uint256(reserve0), uint256(reserve1)) : (uint256(reserve1), uint256(reserve0));
    }

    function _sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        require(amountIn > 0, "Router: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "Router: INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }

    function _getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        require(amountOut > 0, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "Router: INSUFFICIENT_LIQUIDITY");
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        return (numerator / denominator) + 1;
    }

    function _calculateLiquidityAmounts(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal view returns (uint256 amountA, uint256 amountB) {
        address pair = PolkaSwapFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            return (amountADesired, amountBDesired);
        }

        (uint112 reserve0, uint112 reserve1,) = PolkaSwapPair(pair).getReserves();
        if (reserve0 == 0 && reserve1 == 0) {
            return (amountADesired, amountBDesired);
        }

        (address token0,) = _sortTokens(tokenA, tokenB);
        (uint256 reserveA, uint256 reserveB) = tokenA == token0
            ? (uint256(reserve0), uint256(reserve1))
            : (uint256(reserve1), uint256(reserve0));

        uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
        if (amountBOptimal <= amountBDesired) {
            require(amountBOptimal >= amountBMin, "Router: INSUFFICIENT_B_AMOUNT");
            return (amountADesired, amountBOptimal);
        } else {
            uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
            require(amountAOptimal <= amountADesired, "Router: excessive A");
            require(amountAOptimal >= amountAMin, "Router: INSUFFICIENT_A_AMOUNT");
            return (amountAOptimal, amountBDesired);
        }
    }
}
