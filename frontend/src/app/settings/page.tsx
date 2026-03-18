"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState } from "react";
import {
  ArrowLeft,
  Shield,
  Bot,
  AlertTriangle,
  Check,
  Loader2,
  Settings,
  ExternalLink,
  Power,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { parseEther, parseUnits, type Address } from "viem";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMounted } from "@/hooks/useMounted";
import { shortenAddress } from "@/lib/utils";
import { AGENT_WALLET_ABI, WALLET_FACTORY_ABI, CONTRACTS } from "@/lib/contracts";

export default function SettingsPage() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const { agentWallet, refresh } = usePortfolio(address);
  const [agentAddress, setAgentAddress] = useState("");
  const [dailyLimitPAS, setDailyLimitPAS] = useState("");
  const [targetAddress, setTargetAddress] = useState("");

  const { writeContract, isPending: isWriting, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createWallet = () => {
    if (!agentAddress || !CONTRACTS.WALLET_FACTORY) return;
    writeContract({
      address: CONTRACTS.WALLET_FACTORY as Address,
      abi: WALLET_FACTORY_ABI,
      functionName: "createWallet",
      args: [agentAddress as Address],
    });
  };

  const setLimit = () => {
    if (!agentWallet || !dailyLimitPAS) return;
    writeContract({
      address: agentWallet as Address,
      abi: AGENT_WALLET_ABI,
      functionName: "setDailyLimit",
      args: [
        "0x0000000000000000000000000000000000000000" as Address,
        parseEther(dailyLimitPAS),
      ],
    });
  };

  const allowlistTarget = () => {
    if (!agentWallet || !targetAddress) return;
    writeContract({
      address: agentWallet as Address,
      abi: AGENT_WALLET_ABI,
      functionName: "setTargetAllowlist",
      args: [targetAddress as Address, true],
    });
  };

  const revokeAgent = () => {
    if (!agentWallet) return;
    writeContract({
      address: agentWallet as Address,
      abi: AGENT_WALLET_ABI,
      functionName: "revokeAgent",
    });
  };

  const pauseAgent = () => {
    if (!agentWallet) return;
    writeContract({
      address: agentWallet as Address,
      abi: AGENT_WALLET_ABI,
      functionName: "setPaused",
      args: [true],
    });
  };

  if (!mounted) return <div className="min-h-screen bg-polka-dark" />;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-polka-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <Settings size={48} className="mx-auto text-polka-text" />
          <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-polka-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border glass sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-polka-card text-polka-text hover:text-white transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Agent Settings</h1>
            <p className="text-[10px] text-polka-text">Manage your AI agent permissions</p>
          </div>
        </div>
        <ConnectButton />
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Status Card */}
        <div className={`p-6 rounded-2xl border ${agentWallet ? "bg-green-500/5 border-green-500/20" : "bg-polka-card border-polka-border"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${agentWallet ? "bg-green-500/20" : "bg-polka-dark"}`}>
              <Shield size={20} className={agentWallet ? "text-green-400" : "text-polka-text"} />
            </div>
            <div>
              <h2 className="text-white font-semibold">Agent Wallet</h2>
              <p className="text-xs text-polka-text">
                {agentWallet ? "Active and authorized" : "No agent wallet created yet"}
              </p>
            </div>
          </div>
          {agentWallet && (
            <div className="p-3 rounded-lg bg-polka-dark/50 font-mono text-xs text-polka-text break-all">
              {agentWallet}
            </div>
          )}
        </div>

        {/* Create Wallet */}
        {!agentWallet && (
          <div className="p-6 rounded-2xl bg-polka-card border border-polka-border space-y-4">
            <div className="flex items-center gap-3">
              <Bot size={20} className="text-polka-pink" />
              <h3 className="text-white font-semibold">Create Agent Wallet</h3>
            </div>
            <p className="text-sm text-polka-text">
              Create a smart contract wallet and authorize the AI agent to execute transactions on your behalf.
            </p>
            <div>
              <label className="text-xs text-polka-text mb-1 block">Agent Address</label>
              <input
                type="text"
                value={agentAddress}
                onChange={(e) => setAgentAddress(e.target.value)}
                placeholder="0x... (backend agent address)"
                className="w-full px-4 py-2.5 rounded-lg bg-polka-dark border border-polka-border text-white text-sm font-mono placeholder-polka-text/30 focus:outline-none focus:border-polka-pink/50"
              />
            </div>
            <button
              onClick={createWallet}
              disabled={!agentAddress || isWriting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-polka-pink to-polka-purple text-white font-semibold text-sm disabled:opacity-30 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {isWriting || isConfirming ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              {isWriting ? "Confirm in wallet..." : isConfirming ? "Creating..." : "Create Agent Wallet"}
            </button>
          </div>
        )}

        {/* Agent Controls - only when wallet exists */}
        {agentWallet && (
          <>
            {/* Daily Spending Limit */}
            <div className="p-6 rounded-2xl bg-polka-card border border-polka-border space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-yellow-400" />
                <h3 className="text-white font-semibold">Daily Spending Limit</h3>
              </div>
              <p className="text-sm text-polka-text">
                Set maximum PAS the agent can spend per day. Leave empty for unlimited.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={dailyLimitPAS}
                  onChange={(e) => setDailyLimitPAS(e.target.value)}
                  placeholder="e.g. 100"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-polka-dark border border-polka-border text-white text-sm font-mono placeholder-polka-text/30 focus:outline-none focus:border-polka-pink/50"
                />
                <button
                  onClick={setLimit}
                  disabled={!dailyLimitPAS || isWriting}
                  className="px-6 py-2.5 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm font-semibold disabled:opacity-30 hover:bg-yellow-500/30 transition-all"
                >
                  Set Limit
                </button>
              </div>
            </div>

            {/* Allowlist Contract */}
            <div className="p-6 rounded-2xl bg-polka-card border border-polka-border space-y-4">
              <div className="flex items-center gap-3">
                <Check size={20} className="text-green-400" />
                <h3 className="text-white font-semibold">Allowlist Contract</h3>
              </div>
              <p className="text-sm text-polka-text">
                Add a contract address the agent is allowed to interact with (DEX router, etc).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x... contract address"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-polka-dark border border-polka-border text-white text-sm font-mono placeholder-polka-text/30 focus:outline-none focus:border-polka-pink/50"
                />
                <button
                  onClick={allowlistTarget}
                  disabled={!targetAddress || isWriting}
                  className="px-6 py-2.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm font-semibold disabled:opacity-30 hover:bg-green-500/30 transition-all"
                >
                  Allowlist
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-400" />
                <h3 className="text-red-400 font-semibold">Danger Zone</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={pauseAgent}
                  disabled={isWriting}
                  className="py-3 rounded-xl border border-orange-500/30 text-orange-400 text-sm font-semibold hover:bg-orange-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <Power size={14} /> Pause Agent
                </button>
                <button
                  onClick={revokeAgent}
                  disabled={isWriting}
                  className="py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={14} /> Revoke Agent
                </button>
              </div>
            </div>
          </>
        )}

        {/* Transaction Status */}
        {isSuccess && hash && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-green-400" />
              <span className="text-sm text-green-400">Transaction confirmed!</span>
            </div>
            <a
              href={`https://blockscout-testnet.polkadot.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-polka-pink flex items-center gap-1 hover:underline"
            >
              View <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
