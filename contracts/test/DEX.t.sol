// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/WPAS.sol";
import "../src/MockToken.sol";
import "../src/dex/PolkaSwapFactory.sol";
import "../src/dex/PolkaSwapRouter.sol";
import "../src/dex/PolkaSwapPair.sol";

contract DEXTest is Test {
    WPAS wpas;
    MockToken usdt;
    PolkaSwapFactory factory;
    PolkaSwapRouter router;

    address user = address(0xBEEF);

    function setUp() public {
        vm.deal(user, 1000 ether);

        wpas = new WPAS();
        usdt = new MockToken("USDT", "USDT", 6, 1_000_000 * 1e6);
        factory = new PolkaSwapFactory();
        router = new PolkaSwapRouter(address(factory), address(wpas));

        // Give user tokens
        usdt.transfer(user, 100_000 * 1e6);
    }

    function test_AddLiquidityETH() public {
        vm.startPrank(user);
        usdt.approve(address(router), type(uint256).max);

        router.addLiquidityETH{value: 100 ether}(
            address(usdt),
            500 * 1e6,   // 500 USDT
            400 * 1e6,
            80 ether,
            user,
            block.timestamp + 600
        );
        vm.stopPrank();

        // Verify pair was created
        address pair = factory.getPair(address(wpas), address(usdt));
        assertTrue(pair != address(0), "Pair should exist");

        // Verify reserves
        (uint112 r0, uint112 r1,) = PolkaSwapPair(pair).getReserves();
        assertTrue(r0 > 0 && r1 > 0, "Reserves should be positive");

        // Verify LP tokens
        uint256 lpBalance = PolkaSwapPair(pair).balanceOf(user);
        assertTrue(lpBalance > 0, "User should have LP tokens");
    }

    function test_SwapExactETHForTokens() public {
        // First add liquidity
        vm.startPrank(user);
        usdt.approve(address(router), type(uint256).max);
        router.addLiquidityETH{value: 100 ether}(
            address(usdt), 500 * 1e6, 0, 0, user, block.timestamp + 600
        );

        // Swap 1 ETH for USDT
        uint256 usdtBefore = usdt.balanceOf(user);
        address[] memory path = new address[](2);
        path[0] = address(wpas);
        path[1] = address(usdt);

        router.swapExactETHForTokens{value: 1 ether}(
            0, path, user, block.timestamp + 600
        );
        vm.stopPrank();

        uint256 usdtAfter = usdt.balanceOf(user);
        assertTrue(usdtAfter > usdtBefore, "Should receive USDT");
    }

    function test_SwapExactTokensForETH() public {
        vm.startPrank(user);
        usdt.approve(address(router), type(uint256).max);
        router.addLiquidityETH{value: 100 ether}(
            address(usdt), 500 * 1e6, 0, 0, user, block.timestamp + 600
        );

        uint256 ethBefore = user.balance;
        address[] memory path = new address[](2);
        path[0] = address(usdt);
        path[1] = address(wpas);

        router.swapExactTokensForETH(
            10 * 1e6, 0, path, user, block.timestamp + 600
        );
        vm.stopPrank();

        assertTrue(user.balance > ethBefore, "Should receive PAS");
    }

    function test_GetAmountsOut() public {
        vm.startPrank(user);
        usdt.approve(address(router), type(uint256).max);
        router.addLiquidityETH{value: 100 ether}(
            address(usdt), 500 * 1e6, 0, 0, user, block.timestamp + 600
        );
        vm.stopPrank();

        address[] memory path = new address[](2);
        path[0] = address(wpas);
        path[1] = address(usdt);

        uint256[] memory amounts = router.getAmountsOut(1 ether, path);
        assertTrue(amounts[1] > 0, "Quote should return positive amount");
    }

    function test_RemoveLiquidityETH() public {
        vm.startPrank(user);
        usdt.approve(address(router), type(uint256).max);
        router.addLiquidityETH{value: 100 ether}(
            address(usdt), 500 * 1e6, 0, 0, user, block.timestamp + 600
        );

        address pair = factory.getPair(address(wpas), address(usdt));
        uint256 lpBalance = PolkaSwapPair(pair).balanceOf(user);

        // Approve router for LP tokens
        PolkaSwapPair(pair).approve(address(router), lpBalance);

        uint256 ethBefore = user.balance;
        uint256 usdtBefore = usdt.balanceOf(user);

        router.removeLiquidityETH(
            address(usdt), lpBalance, 0, 0, user, block.timestamp + 600
        );
        vm.stopPrank();

        assertTrue(user.balance > ethBefore, "Should receive PAS back");
        assertTrue(usdt.balanceOf(user) > usdtBefore, "Should receive USDT back");
    }
}
