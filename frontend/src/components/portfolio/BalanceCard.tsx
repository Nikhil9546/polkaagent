"use client";

import { Coins, Droplets, RefreshCw, Shield, ExternalLink } from "lucide-react";
import { formatBalance } from "@/lib/utils";
import type { PortfolioData } from "@/lib/api";

interface BalanceCardProps {
  portfolio: PortfolioData | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const TOKEN_ICONS: Record<string, string> = {
  PAS: "P",
  USDT: "U",
  USDC: "C",
};

const TOKEN_COLORS: Record<string, string> = {
  PAS: "from-polka-pink to-polka-purple",
  USDT: "from-green-500 to-emerald-500",
  USDC: "from-blue-500 to-cyan-500",
};

export function BalanceCard({ portfolio, isLoading, onRefresh }: BalanceCardProps) {
  if (!portfolio) {
    return (
      <div className="p-6 rounded-2xl bg-polka-card border border-polka-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-polka-text uppercase tracking-wider">Portfolio</h3>
        </div>
        <p className="text-sm text-polka-text">Connect wallet to view portfolio</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-polka-text uppercase tracking-wider flex items-center gap-2">
          <Coins size={16} />
          Portfolio
        </h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-polka-card text-polka-text hover:text-white transition-all"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Agent Wallet Status */}
      {portfolio.agent_wallet_address ? (
        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={12} className="text-green-400" />
            <span className="text-xs font-semibold text-green-400">Agent Wallet Active</span>
          </div>
          <a
            href={`https://blockscout-testnet.polkadot.io/address/${portfolio.agent_wallet_address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-polka-text hover:text-polka-pink flex items-center gap-1 truncate"
          >
            {portfolio.agent_wallet_address.slice(0, 10)}...{portfolio.agent_wallet_address.slice(-8)}
            <ExternalLink size={8} />
          </a>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-polka-card/50 border border-polka-border/50">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-polka-text" />
            <span className="text-xs text-polka-text">No agent wallet — go to Settings to create one</span>
          </div>
        </div>
      )}

      {/* Token Balances */}
      <div className="space-y-2">
        {Object.entries(portfolio.token_balances).map(([token, balData]) => {
          const bal = typeof balData === "string" ? balData : (balData as any)?.wallet || "0";
          const agentBal = typeof balData === "string" ? "0" : (balData as any)?.agent_wallet || "0";
          const total = parseFloat(bal) + parseFloat(agentBal);
          const gradient = TOKEN_COLORS[token] || "from-gray-500 to-gray-600";

          return (
            <div
              key={token}
              className="flex items-center gap-3 p-3 rounded-xl bg-polka-card/50 border border-polka-border/50 hover:border-polka-border transition-all"
            >
              <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center text-white text-sm font-bold`}>
                {TOKEN_ICONS[token] || token[0]}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">{token}</span>
                  <span className="text-sm font-mono text-white">{formatBalance(String(total))}</span>
                </div>
                {parseFloat(agentBal) > 0 && (
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[10px] text-polka-text">In Agent Wallet</span>
                    <span className="text-[10px] text-polka-text font-mono">{formatBalance(agentBal)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Native PAS balance */}
        {portfolio.native_balance && parseFloat(portfolio.native_balance) > 0 && !portfolio.token_balances["PAS"] && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-polka-card/50 border border-polka-border/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-polka-pink to-polka-purple flex items-center justify-center text-white text-sm font-bold">
              P
            </div>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-sm font-semibold text-white">PAS</span>
              <span className="text-sm font-mono text-white">{formatBalance(portfolio.native_balance)}</span>
            </div>
          </div>
        )}
      </div>

      {/* LP Positions */}
      {portfolio.lp_positions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-polka-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Droplets size={12} />
            Liquidity Positions
          </h4>
          {portfolio.lp_positions.map((lp, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-polka-card/50 border border-polka-border/50"
            >
              <div className="text-sm font-semibold text-white">{lp.pair}</div>
              <div className="flex gap-4 mt-1 text-xs text-polka-text">
                <span>PAS: {formatBalance(lp.reserve_pas || "0")}</span>
                <span>
                  {lp.pair?.split("/")[1]}: {formatBalance(Object.values(lp).find((v, idx) => idx > 1 && typeof v === "string" && v !== lp.pair_address) as string || "0")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
