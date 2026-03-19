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
      <div className="min-h-screen bg-polka-dark grid-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg border border-polka-border bg-polka-card flex items-center justify-center mx-auto">
            <Settings size={24} className="text-polka-text" />
          </div>
          <h2 className="font-display text-xl font-bold text-white tracking-wide">Connect Your Wallet</h2>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-polka-dark grid-bg scanlines">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border glass sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-polka-pink/[0.03] text-polka-text hover:text-polka-pink transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-white tracking-wide">Agent Settings</h1>
            <p className="font-mono text-[8px] text-polka-text/70 uppercase tracking-[0.2em]">Manage AI Agent Permissions</p>
          </div>
        </div>
        <ConnectButton />
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {/* Status Card */}
        <div className={`p-6 rounded-xl tech-card ${agentWallet ? "border-emerald-500/10" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${agentWallet ? "border-emerald-500/15 bg-emerald-500/[0.05]" : "border-polka-border bg-polka-darker"}`}>
              <Shield size={18} className={agentWallet ? "text-emerald-400" : "text-polka-text"} />
            </div>
            <div>
              <h2 className="font-display text-white font-semibold tracking-wide">Agent Wallet</h2>
              <p className="font-mono text-[8px] text-polka-text/70 uppercase tracking-wider">
                {agentWallet ? "Active and authorized" : "No agent wallet created yet"}
              </p>
            </div>
          </div>
          {agentWallet && (
            <div className="p-3 rounded-lg border border-polka-border bg-polka-darker font-mono text-[10px] text-polka-text/80 break-all tracking-wider">
              {agentWallet}
            </div>
          )}
        </div>

        {/* Create Wallet */}
        {!agentWallet && (
          <div className="p-6 rounded-xl tech-card space-y-4">
            <div className="flex items-center gap-3">
              <Bot size={18} className="text-polka-pink" />
              <h3 className="font-display text-white font-semibold tracking-wide">Create Agent Wallet</h3>
            </div>
            <p className="text-[13px] text-polka-text/80 leading-relaxed">
              Create a smart contract wallet and authorize the AI agent to execute transactions on your behalf.
            </p>
            <div>
              <label className="font-mono text-[8px] text-polka-text/70 mb-1.5 block uppercase tracking-wider">Agent Address</label>
              <input
                type="text"
                value={agentAddress}
                onChange={(e) => setAgentAddress(e.target.value)}
                placeholder="0x... (backend agent address)"
                className="w-full px-4 py-2.5 rounded-lg border border-polka-border bg-polka-darker text-white font-mono text-[11px] placeholder-polka-text/50 focus:outline-none focus:border-polka-pink/15 tracking-wider"
              />
            </div>
            <button
              onClick={createWallet}
              disabled={!agentAddress || isWriting}
              className="w-full py-3 rounded-lg border border-polka-pink/20 bg-polka-pink/10 text-polka-pink font-mono text-[11px] font-semibold uppercase tracking-wider disabled:opacity-20 hover:bg-polka-pink/15 transition-all flex items-center justify-center gap-2"
            >
              {isWriting || isConfirming ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              {isWriting ? "Confirm in wallet..." : isConfirming ? "Creating..." : "Create Agent Wallet"}
            </button>
          </div>
        )}

        {/* Agent Controls */}
        {agentWallet && (
          <>
            {/* Daily Spending Limit */}
            <div className="p-6 rounded-xl tech-card space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign size={18} className="text-yellow-400" />
                <h3 className="font-display text-white font-semibold tracking-wide">Daily Spending Limit</h3>
              </div>
              <p className="text-[13px] text-polka-text/80 leading-relaxed">
                Set maximum PAS the agent can spend per day.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={dailyLimitPAS}
                  onChange={(e) => setDailyLimitPAS(e.target.value)}
                  placeholder="e.g. 100"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-polka-border bg-polka-darker text-white font-mono text-[11px] placeholder-polka-text/50 focus:outline-none focus:border-polka-pink/15 tracking-wider"
                />
                <button
                  onClick={setLimit}
                  disabled={!dailyLimitPAS || isWriting}
                  className="px-6 py-2.5 rounded-lg border border-yellow-500/15 bg-yellow-500/[0.05] text-yellow-400 font-mono text-[10px] font-semibold uppercase tracking-wider disabled:opacity-20 hover:bg-yellow-500/10 transition-all"
                >
                  Set Limit
                </button>
              </div>
            </div>

            {/* Allowlist Contract */}
            <div className="p-6 rounded-xl tech-card space-y-4">
              <div className="flex items-center gap-3">
                <Check size={18} className="text-emerald-400" />
                <h3 className="font-display text-white font-semibold tracking-wide">Allowlist Contract</h3>
              </div>
              <p className="text-[13px] text-polka-text/80 leading-relaxed">
                Add a contract address the agent is allowed to interact with.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x... contract address"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-polka-border bg-polka-darker text-white font-mono text-[11px] placeholder-polka-text/50 focus:outline-none focus:border-polka-pink/15 tracking-wider"
                />
                <button
                  onClick={allowlistTarget}
                  disabled={!targetAddress || isWriting}
                  className="px-6 py-2.5 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.05] text-emerald-400 font-mono text-[10px] font-semibold uppercase tracking-wider disabled:opacity-20 hover:bg-emerald-500/10 transition-all"
                >
                  Allowlist
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded-xl tech-card border-red-500/8 space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-400" />
                <h3 className="font-display text-red-400 font-semibold tracking-wide">Danger Zone</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={pauseAgent}
                  disabled={isWriting}
                  className="py-3 rounded-lg border border-orange-500/15 bg-orange-500/[0.03] text-orange-400 font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-orange-500/[0.06] transition-all flex items-center justify-center gap-2"
                >
                  <Power size={12} /> Pause Agent
                </button>
                <button
                  onClick={revokeAgent}
                  disabled={isWriting}
                  className="py-3 rounded-lg border border-red-500/15 bg-red-500/[0.03] text-red-400 font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-red-500/[0.06] transition-all flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={12} /> Revoke Agent
                </button>
              </div>
            </div>
          </>
        )}

        {/* Transaction Status */}
        {isSuccess && hash && (
          <div className="p-4 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-400" />
              <span className="font-mono text-[11px] text-emerald-400 uppercase tracking-wider">Transaction confirmed!</span>
            </div>
            <a
              href={`https://blockscout-testnet.polkadot.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] text-polka-pink flex items-center gap-1 hover:underline tracking-wider"
            >
              View <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
