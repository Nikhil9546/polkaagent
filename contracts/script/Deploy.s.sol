// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/WPAS.sol";
import "../src/MockToken.sol";
import "../src/AgentWalletFactory.sol";
import "../src/IntentExecutor.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy WPAS
        WPAS wpas = new WPAS();
        console.log("WPAS deployed at:", address(wpas));

        // 2. Deploy Mock tokens (fallback for testnet)
        MockToken usdt = new MockToken("Mock USDT", "USDT", 6, 1_000_000 * 1e6);
        console.log("MockUSDT deployed at:", address(usdt));

        MockToken usdc = new MockToken("Mock USDC", "USDC", 6, 1_000_000 * 1e6);
        console.log("MockUSDC deployed at:", address(usdc));

        // 3. Deploy AgentWalletFactory
        AgentWalletFactory factory = new AgentWalletFactory();
        console.log("AgentWalletFactory deployed at:", address(factory));

        // NOTE: Uniswap V2 Router address must be set after deployment
        // For now, use address(0) as placeholder — update after deploying UniV2
        // IntentExecutor executor = new IntentExecutor(routerAddress, address(wpas));

        console.log("--- Base deployment complete ---");
        console.log("Next steps:");
        console.log("1. Deploy Uniswap V2 Factory + Router");
        console.log("2. Deploy IntentExecutor with router address");
        console.log("3. Register tokens in IntentExecutor");
        console.log("4. Create liquidity pools");

        vm.stopBroadcast();
    }
}
