// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/WPAS.sol";
import "../src/MockToken.sol";
import "../src/AgentWalletFactory.sol";
import "../src/IntentExecutor.sol";
import "../src/dex/PolkaSwapFactory.sol";
import "../src/dex/PolkaSwapRouter.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== PolkaAgent Full Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy WPAS (WETH equivalent)
        WPAS wpas = new WPAS();
        console.log("1. WPAS:", address(wpas));

        // 2. Deploy Mock tokens
        MockToken usdt = new MockToken("PolkaAgent USDT", "USDT", 6, 1_000_000 * 1e6);
        console.log("2. USDT:", address(usdt));

        MockToken usdc = new MockToken("PolkaAgent USDC", "USDC", 6, 1_000_000 * 1e6);
        console.log("3. USDC:", address(usdc));

        // 3. Deploy DEX
        PolkaSwapFactory dexFactory = new PolkaSwapFactory();
        console.log("4. DEX Factory:", address(dexFactory));

        PolkaSwapRouter router = new PolkaSwapRouter(address(dexFactory), address(wpas));
        console.log("5. DEX Router:", address(router));

        // 4. Deploy AgentWalletFactory
        AgentWalletFactory walletFactory = new AgentWalletFactory();
        console.log("6. WalletFactory:", address(walletFactory));

        // 5. Deploy IntentExecutor
        IntentExecutor executor = new IntentExecutor(address(router), address(wpas));
        console.log("7. IntentExecutor:", address(executor));

        // 6. Register tokens in IntentExecutor
        executor.registerToken("USDT", address(usdt));
        executor.registerToken("USDC", address(usdc));
        executor.registerToken("WPAS", address(wpas));
        console.log("8. Tokens registered in IntentExecutor");

        // 7. Create initial liquidity pools
        // Approve router for tokens
        usdt.approve(address(router), type(uint256).max);
        usdc.approve(address(router), type(uint256).max);

        // Create PAS/USDT pool: 1000 PAS = 5000 USDT (1 PAS = 5 USDT)
        router.addLiquidityETH{value: 1000 ether}(
            address(usdt),
            5_000 * 1e6,    // 5000 USDT
            4_500 * 1e6,    // min USDT (10% slippage)
            900 ether,       // min PAS
            deployer,
            block.timestamp + 600
        );
        console.log("9. PAS/USDT pool created (1000 PAS + 5000 USDT)");

        // Create PAS/USDC pool: 1000 PAS = 5000 USDC
        router.addLiquidityETH{value: 1000 ether}(
            address(usdc),
            5_000 * 1e6,
            4_500 * 1e6,
            900 ether,
            deployer,
            block.timestamp + 600
        );
        console.log("10. PAS/USDC pool created (1000 PAS + 5000 USDC)");

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Copy these addresses to your .env:");
        console.log("WPAS_ADDRESS=", address(wpas));
        console.log("USDT_ADDRESS=", address(usdt));
        console.log("USDC_ADDRESS=", address(usdc));
        console.log("FACTORY_ADDRESS=", address(dexFactory));
        console.log("ROUTER_ADDRESS=", address(router));
        console.log("WALLET_FACTORY_ADDRESS=", address(walletFactory));
        console.log("INTENT_EXECUTOR_ADDRESS=", address(executor));
    }
}
