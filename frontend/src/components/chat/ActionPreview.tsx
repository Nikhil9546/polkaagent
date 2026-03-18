"use client";

import {
  ArrowRightLeft,
  Send,
  Droplets,
  BarChart3,
  Wallet,
  Check,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import type { ActionData } from "@/lib/api";
import { formatBalance } from "@/lib/utils";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  transfer: <Send size={18} />,
  swap: <ArrowRightLeft size={18} />,
  add_liquidity: <Droplets size={18} />,
  remove_liquidity: <Droplets size={18} />,
  check_balance: <Wallet size={18} />,
  get_quote: <BarChart3 size={18} />,
  portfolio: <BarChart3 size={18} />,
};

const ACTION_COLORS: Record<string, string> = {
  transfer: "from-blue-500 to-cyan-500",
  swap: "from-polka-pink to-polka-purple",
  add_liquidity: "from-green-500 to-emerald-500",
  remove_liquidity: "from-orange-500 to-amber-500",
  check_balance: "from-violet-500 to-purple-500",
  get_quote: "from-indigo-500 to-blue-500",
  portfolio: "from-violet-500 to-purple-500",
};

interface ActionPreviewProps {
  action: ActionData;
  onConfirm?: () => void;
  onReject?: () => void;
}

export function ActionPreview({ action, onConfirm, onReject }: ActionPreviewProps) {
  const { address } = useAccount();
  const [status, setStatus] = useState<"pending" | "confirming" | "confirmed" | "rejected">("pending");
  const { sendTransactionAsync } = useSendTransaction();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleConfirm = async () => {
    if (!action.transaction || !address) return;
    setStatus("confirming");

    try {
      const hash = await sendTransactionAsync({
        to: action.transaction.to as `0x${string}`,
        data: action.transaction.data as `0x${string}`,
        value: BigInt(action.transaction.value || "0"),
      });
      setTxHash(hash);
      setStatus("confirmed");
      onConfirm?.();
    } catch (error) {
      console.error("Transaction failed:", error);
      setStatus("pending");
    }
  };

  const handleReject = () => {
    setStatus("rejected");
    onReject?.();
  };

  const icon = ACTION_ICONS[action.action] || <BarChart3 size={18} />;
  const gradient = ACTION_COLORS[action.action] || "from-gray-500 to-gray-600";

  const paramEntries: Array<{ k: string; v: string }> = action.params
    ? Object.entries(action.params)
        .filter(
          ([key, value]) =>
            key !== "transaction" &&
            key !== "requires_confirmation" &&
            key !== "description" &&
            typeof value !== "object"
        )
        .map(([key, value]) => ({ k: key, v: String(value ?? "") }))
    : [];

  return (
    <div className="mt-3 rounded-xl border border-polka-border bg-polka-card/80 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${gradient} bg-opacity-10`}>
        <div className="p-1 rounded-lg bg-white/10">{icon}</div>
        <span className="text-sm font-semibold capitalize">{action.action.replace("_", " ")}</span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {/* Show params */}
        {paramEntries.map(({ k, v }) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-polka-text capitalize">{k.replace("_", " ")}</span>
            <span className="text-white font-mono">
              {v.startsWith("0x")
                ? `${v.slice(0, 8)}...${v.slice(-6)}`
                : v}
            </span>
          </div>
        ))}

        {/* Quote info for swaps */}
        {action.result?.amount_out ? (
          <div className="mt-2 p-2.5 rounded-lg bg-polka-dark/50 border border-polka-border">
            <div className="flex justify-between text-sm">
              <span className="text-polka-text">You receive</span>
              <span className="text-green-400 font-semibold font-mono">
                ~{formatBalance(String(action.result.amount_out))} {String(action.result.to_token)}
              </span>
            </div>
            {action.result.price_impact ? (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-polka-text">Price impact</span>
                <span className="text-polka-text">{String(action.result.price_impact)}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Balance display */}
        {action.result?.balances ? (
          <div className="space-y-1.5">
            {Object.entries(action.result.balances as Record<string, string>).map(([token, bal]) => (
              <div key={token} className="flex justify-between text-sm">
                <span className="text-polka-text">{token}</span>
                <span className="text-white font-mono">{formatBalance(bal)}</span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Description */}
        {action.description ? (
          <p className="text-xs text-polka-text mt-1">{action.description}</p>
        ) : null}
      </div>

      {/* Autonomous execution result */}
      {action.result?.tx_hash ? (
        <div className={`flex items-center justify-between px-4 py-3 border-t ${
          action.result?.success ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
        }`}>
          <div className="flex items-center gap-2">
            {action.result?.success ? (
              <>
                <Check size={16} className="text-green-400" />
                <span className="text-sm text-green-400">Executed autonomously</span>
              </>
            ) : (
              <>
                <X size={16} className="text-red-400" />
                <span className="text-sm text-red-400">Transaction failed</span>
              </>
            )}
          </div>
          <a
            href={`https://blockscout-testnet.polkadot.io/tx/${String(action.result.tx_hash)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-polka-pink hover:underline"
          >
            View tx <ExternalLink size={12} />
          </a>
        </div>
      ) : action.result?.error ? (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-red-500/20 bg-red-500/5">
          <X size={16} className="text-red-400" />
          <span className="text-sm text-red-400">{String(action.result.error)}</span>
        </div>
      ) : null}

      {/* Manual transaction confirmation (fallback) */}
      {action.transaction && !action.result?.tx_hash && status === "pending" && (
        <div className="flex gap-2 px-4 py-3 border-t border-polka-border">
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold
              hover:opacity-90 transition-all"
          >
            <Check size={16} /> Confirm
          </button>
          <button
            onClick={handleReject}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-polka-dark border border-polka-border text-polka-text text-sm font-semibold
              hover:text-red-400 hover:border-red-500/50 transition-all"
          >
            <X size={16} /> Reject
          </button>
        </div>
      )}

      {/* Rejected */}
      {status === "rejected" && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-red-500/20 bg-red-500/5">
          <X size={16} className="text-red-400" />
          <span className="text-sm text-red-400">Transaction rejected</span>
        </div>
      )}
    </div>
  );
}
