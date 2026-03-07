// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentWallet.sol";
import "../src/AgentWalletFactory.sol";
import "../src/MockToken.sol";

contract AgentWalletTest is Test {
    AgentWallet wallet;
    AgentWalletFactory factory;
    MockToken token;

    address owner = address(0x1);
    address agent = address(0x2);
    address target = address(0x3);
    address recipient = address(0x4);

    function setUp() public {
        vm.deal(owner, 100 ether);
        vm.deal(agent, 10 ether);

        token = new MockToken("Test", "TST", 18, 1_000_000 ether);
        token.mint(owner, 1000 ether);

        wallet = new AgentWallet(owner, agent);

        // Fund wallet
        vm.prank(owner);
        payable(address(wallet)).transfer(50 ether);
        token.transfer(address(wallet), 500 ether);

        // Allowlist target
        vm.prank(owner);
        wallet.setTargetAllowlist(target, true);
    }

    function test_OwnerCanWithdrawNative() public {
        vm.prank(owner);
        wallet.withdraw(address(0), 10 ether, recipient);
        assertEq(recipient.balance, 10 ether);
    }

    function test_OwnerCanWithdrawToken() public {
        vm.prank(owner);
        wallet.withdraw(address(token), 100 ether, recipient);
        assertEq(token.balanceOf(recipient), 100 ether);
    }

    function test_AgentCanExecuteCall() public {
        vm.prank(owner);
        wallet.setTargetAllowlist(recipient, true);

        vm.prank(agent);
        wallet.executeCall(recipient, 1 ether, "");
        assertEq(recipient.balance, 1 ether);
    }

    function test_AgentCannotExceedDailyLimit() public {
        vm.prank(owner);
        wallet.setDailyLimit(address(0), 5 ether);

        vm.prank(owner);
        wallet.setTargetAllowlist(recipient, true);

        vm.prank(agent);
        wallet.executeCall(recipient, 3 ether, "");

        vm.prank(agent);
        vm.expectRevert("AgentWallet: daily limit exceeded");
        wallet.executeCall(recipient, 3 ether, "");
    }

    function test_DailyLimitResetsAfter24h() public {
        vm.prank(owner);
        wallet.setDailyLimit(address(0), 5 ether);
        vm.prank(owner);
        wallet.setTargetAllowlist(recipient, true);

        vm.prank(agent);
        wallet.executeCall(recipient, 5 ether, "");

        // Warp 24h + 1s
        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(agent);
        wallet.executeCall(recipient, 5 ether, "");
        assertEq(recipient.balance, 10 ether);
    }

    function test_NonAgentCannotExecute() public {
        vm.prank(address(0x999));
        vm.expectRevert("AgentWallet: not agent");
        wallet.executeCall(target, 1 ether, "");
    }

    function test_AgentCannotCallNonAllowlisted() public {
        vm.prank(agent);
        vm.expectRevert("AgentWallet: target not allowlisted");
        wallet.executeCall(address(0x999), 1 ether, "");
    }

    function test_PauseBlocksAgent() public {
        vm.prank(owner);
        wallet.setPaused(true);

        vm.prank(agent);
        vm.expectRevert("AgentWallet: paused");
        wallet.executeCall(target, 1 ether, "");
    }

    function test_OwnerCanRevokeAgent() public {
        vm.prank(owner);
        wallet.revokeAgent();

        vm.prank(agent);
        vm.expectRevert("AgentWallet: not agent");
        wallet.executeCall(target, 1 ether, "");
    }

    function test_AgentCanTransferTokens() public {
        vm.prank(agent);
        wallet.executeTokenTransfer(address(token), recipient, 50 ether);
        assertEq(token.balanceOf(recipient), 50 ether);
    }

    function test_FactoryCreatesWallet() public {
        factory = new AgentWalletFactory();

        vm.prank(owner);
        address walletAddr = factory.createWallet(agent);
        assertEq(factory.getWallet(owner), walletAddr);
        assertEq(factory.totalWallets(), 1);

        AgentWallet w = AgentWallet(payable(walletAddr));
        assertEq(w.owner(), owner);
        assertEq(w.agent(), agent);
    }

    function test_FactoryPreventsDoubleCreate() public {
        factory = new AgentWalletFactory();

        vm.prank(owner);
        factory.createWallet(agent);

        vm.prank(owner);
        vm.expectRevert("Factory: wallet exists");
        factory.createWallet(agent);
    }

    function test_ViewFunctions() public view {
        assertEq(wallet.getNativeBalance(), 50 ether);
        assertEq(wallet.getTokenBalance(address(token)), 500 ether);
    }
}
