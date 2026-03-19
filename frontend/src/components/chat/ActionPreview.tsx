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
  TrendingUp,
  Zap,
  Target,
} from "lucide-react";
import { useState } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import type { ActionData } from "@/lib/api";
import { formatBalance } from "@/lib/utils";

const ACTION_META: Record<string, { icon: React.ReactNode; gradient: string; label: string }> = {
  transfer: { icon: <Send size={15} />, gradient: "from-blue-500 to-cyan-500", label: "Transfer" },
  swap: { icon: <ArrowRightLeft size={15} />, gradient: "from-polka-pink to-polka-purple", label: "Swap" },
  add_liquidity: { icon: <Droplets size={15} />, gradient: "from-green-500 to-emerald-500", label: "Add Liquidity" },
  remove_liquidity: { icon: <Droplets size={15} />, gradient: "from-orange-500 to-amber-500", label: "Remove Liquidity" },
  check_balance: { icon: <Wallet size={15} />, gradient: "from-violet-500 to-purple-500", label: "Balance" },
  get_quote: { icon: <BarChart3 size={15} />, gradient: "from-indigo-500 to-blue-500", label: "Quote" },
  portfolio: { icon: <BarChart3 size={15} />, gradient: "from-violet-500 to-purple-500", label: "Portfolio" },
  get_signals: { icon: <TrendingUp size={15} />, gradient: "from-amber-500 to-orange-500", label: "Signals" },
  auto_trade: { icon: <Target size={15} />, gradient: "from-emerald-500 to-cyan-500", label: "Auto Trade" },
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
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const meta = ACTION_META[action.action] || ACTION_META.check_balance;
  const isExecuted = Boolean(action.result?.tx_hash);
  const isSuccess_ = Boolean(action.result?.success);
  const hasError = Boolean(action.result?.error);

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
    } catch {
      setStatus("pending");
    }
  };

  // Build display params
  const displayParams = action.params
    ? Object.entries(action.params)
        .filter(([key]) =>
          !["transaction", "requires_confirmation", "description", "error",
           "tx_hash", "success", "status", "block_number", "gas_used",
           "quote", "action", "params", "signals", "prices",
           "total_signals", "executed_trades", "trades_executed",
           "portfolio", "balances", "wallet_balances", "agent_wallet_balances",
           "wallet_address", "agent_wallet"].includes(key)
        )
        .filter(([, value]) => typeof value !== "object")
        .map(([key, value]) => ({ k: key, v: String(value ?? "") }))
    : [];

  return (
    <div className="mt-2 rounded-2xl border border-polka-border/20 bg-white/[0.02] overflow-hidden card-shine success-pop">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-sm`}>
            {meta.icon}
          </div>
          <span className="text-[13px] font-semibold text-white">{meta.label}</span>
        </div>
        {isExecuted && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            isSuccess_ ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {isSuccess_ ? "Executed" : "Failed"}
          </span>
        )}
      </div>

      {/* Params */}
      {displayParams.length > 0 && (
        <div className="px-4 py-2 space-y-1.5 border-t border-polka-border/10">
          {displayParams.map(({ k, v }) => (
            <div key={k} className="flex justify-between text-[12px]">
              <span className="text-polka-text/80 capitalize">{k.replace(/_/g, " ")}</span>
              <span className="text-white/80 font-mono text-[11px]">
                {v.startsWith("0x") ? `${v.slice(0, 8)}...${v.slice(-6)}` : v}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quote display */}
      {action.result?.amount_out ? (
        <div className="mx-4 my-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex justify-between text-[13px]">
            <span className="text-polka-text/85">You receive</span>
            <span className="text-emerald-400 font-semibold font-mono">
              ~{formatBalance(String(action.result.amount_out))} {String(action.result.to_token || "")}
            </span>
          </div>
          {action.result.price_impact ? (
            <div className="flex justify-between text-[11px] mt-1">
              <span className="text-polka-text/70">Price impact</span>
              <span className="text-polka-text/85">{String(action.result.price_impact)}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Balance display */}
      {action.result?.balances ? (
        <div className="px-4 py-2 space-y-1 border-t border-polka-border/10">
          {Object.entries(action.result.balances as Record<string, string>).map(([token, bal]) => (
            <div key={token} className="flex justify-between text-[12px]">
              <span className="text-polka-text/80">{token}</span>
              <span className="text-white/80 font-mono">{formatBalance(bal)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Signals display */}
      {action.result?.signals ? (
        <div className="px-4 py-2 space-y-2 border-t border-polka-border/10">
          {(action.result.signals as Array<Record<string, string>>).map((signal, i) => (
            <div key={i} className={`p-2.5 rounded-lg text-[11px] ${
              signal.signal_type === "BUY" ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-amber-500/5 border border-amber-500/10"
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`font-bold ${signal.signal_type === "BUY" ? "text-emerald-400" : "text-amber-400"}`}>
                  {signal.signal_type}
                </span>
                <span className="text-white/80 font-medium">{signal.token}</span>
                <span className="text-polka-text/70">({signal.strength})</span>
              </div>
              <p className="text-polka-text/85 leading-snug">{signal.reason}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Executed trades display */}
      {action.result?.executed_trades ? (
        <div className="px-4 py-2 space-y-2 border-t border-polka-border/10">
          <p className="text-[10px] font-medium text-polka-text/70 uppercase tracking-wider">Executed Trades</p>
          {(action.result.executed_trades as Array<Record<string, any>>).map((trade, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-white/80">
                  {trade.trade?.amount || trade.trade?.from} {trade.trade?.from} → {trade.trade?.to}
                </span>
                <span className={`font-medium ${trade.result?.success ? "text-emerald-400" : "text-red-400"}`}>
                  {trade.result?.status || "unknown"}
                </span>
              </div>
              {trade.result?.tx_hash && (
                <a
                  href={`https://blockscout-testnet.polkadot.io/tx/0x${trade.result.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-polka-pink/60 hover:text-polka-pink text-[10px] font-mono mt-1 block"
                >
                  {String(trade.result.tx_hash).slice(0, 16)}...
                </a>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Autonomous execution result */}
      {isExecuted ? (
        <div className={`flex items-center justify-between px-4 py-3 border-t ${
          isSuccess_ ? "border-emerald-500/10 bg-emerald-500/[0.03]" : "border-red-500/10 bg-red-500/[0.03]"
        }`}>
          <div className="flex items-center gap-2">
            {isSuccess_ ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <X size={14} className="text-red-400" />
            )}
            <span className={`text-[12px] font-medium ${isSuccess_ ? "text-emerald-400" : "text-red-400"}`}>
              {isSuccess_ ? "Executed autonomously" : "Transaction failed"}
            </span>
          </div>
          <a
            href={`https://blockscout-testnet.polkadot.io/tx/0x${String(action.result?.tx_hash)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-polka-pink/70 hover:text-polka-pink transition-smooth"
          >
            View <ExternalLink size={10} />
          </a>
        </div>
      ) : hasError ? (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-red-500/10 bg-red-500/[0.03]">
          <X size={14} className="text-red-400" />
          <span className="text-[12px] text-red-400">{String(action.result?.error)}</span>
        </div>
      ) : null}

      {/* Manual confirmation fallback */}
      {action.transaction && !isExecuted && !hasError && status === "pending" && (
        <div className="flex gap-2 px-4 py-3 border-t border-polka-border/10">
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[12px] font-semibold hover:opacity-90 transition-smooth"
          >
            <Check size={14} /> Confirm
          </button>
          <button
            onClick={() => { setStatus("rejected"); onReject?.(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-polka-border/30 text-polka-text/85 text-[12px] font-medium hover:text-red-400 hover:border-red-500/30 transition-smooth"
          >
            <X size={14} /> Reject
          </button>
        </div>
      )}

      {status === "confirming" && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-polka-border/10">
          <Loader2 size={14} className="animate-spin text-polka-pink" />
          <span className="text-[12px] text-polka-text/85">Waiting for wallet...</span>
        </div>
      )}

      {action.description ? (
        <div className="px-4 py-2 border-t border-polka-border/10">
          <p className="text-[11px] text-polka-text/70">{action.description}</p>
        </div>
      ) : null}
    </div>
  );
}
