"use client";

import { useAccount, useBalance } from "wagmi";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Droplets,
  Clock,
  ExternalLink,
  RefreshCw,
  Shield,
  ArrowRightLeft,
  Send,
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMounted } from "@/hooks/useMounted";
import { formatBalance, shortenAddress } from "@/lib/utils";

const TOKEN_META: Record<string, { color: string; icon: string }> = {
  PAS: { color: "border-polka-pink/15 bg-polka-pink/[0.05] text-polka-pink", icon: "P" },
  USDT: { color: "border-emerald-500/15 bg-emerald-500/[0.05] text-emerald-400", icon: "$" },
  USDC: { color: "border-blue-500/15 bg-blue-500/[0.05] text-blue-400", icon: "$" },
};

export default function PortfolioPage() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const { data: nativeBalance } = useBalance({ address });
  const { portfolio, agentWallet, isLoading, refresh } = usePortfolio(address);
  const [activeTab, setActiveTab] = useState<"tokens" | "liquidity" | "history">("tokens");

  if (!mounted) return <div className="min-h-screen bg-polka-dark" />;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-polka-dark grid-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg border border-polka-border bg-polka-card flex items-center justify-center mx-auto">
            <Wallet size={24} className="text-polka-text" />
          </div>
          <h2 className="font-display text-xl font-bold text-white tracking-wide">Connect Your Wallet</h2>
          <p className="font-mono text-polka-text text-[10px] uppercase tracking-wider">Connect to view your portfolio</p>
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
            <h1 className="font-display text-lg font-bold text-white tracking-wide">Portfolio</h1>
            <p className="font-mono text-[8px] text-polka-text/40 uppercase tracking-[0.2em]">Polkadot Hub TestNet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-polka-pink/[0.03] text-polka-text hover:text-polka-pink transition-all"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Total Balance Card */}
        <div className="relative overflow-hidden rounded-xl tech-card corner-accents p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-polka-pink/[0.03] rounded-full blur-[100px]" />
          <div className="relative">
            <p className="tech-label text-polka-text/50 mb-2">Total Balance</p>
            <h2 className="num-display text-4xl text-white mb-1">
              {formatBalance(nativeBalance?.formatted || "0", 4)} <span className="text-2xl text-polka-text">PAS</span>
            </h2>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 font-mono text-[10px] text-polka-text/40 uppercase tracking-wider">
                <Wallet size={12} />
                <span>{shortenAddress(address!, 6)}</span>
              </div>
              {agentWallet && (
                <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-400/70 uppercase tracking-wider">
                  <Shield size={12} />
                  <span>Agent Active</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg border border-polka-border bg-polka-card">
          {(["tokens", "liquidity", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-md font-mono text-[10px] font-medium transition-all uppercase tracking-wider
                ${activeTab === tab
                  ? "bg-polka-pink/10 text-polka-pink border border-polka-pink/15"
                  : "text-polka-text/40 hover:text-white border border-transparent"
                }`}
            >
              {tab === "tokens" && <span className="flex items-center justify-center gap-1.5"><Wallet size={12} /> Tokens</span>}
              {tab === "liquidity" && <span className="flex items-center justify-center gap-1.5"><Droplets size={12} /> Liquidity</span>}
              {tab === "history" && <span className="flex items-center justify-center gap-1.5"><Clock size={12} /> History</span>}
            </button>
          ))}
        </div>

        {/* Token Balances */}
        {activeTab === "tokens" && (
          <div className="space-y-2">
            <TokenRow symbol="PAS" walletBalance={nativeBalance?.formatted || "0"} agentBalance="0" />
            {portfolio?.token_balances && Object.entries(portfolio.token_balances).map(([symbol, data]) => {
              if (symbol === "PAS") return null;
              const balData = typeof data === "string" ? { wallet: data, agent_wallet: "0" } : data;
              return (
                <TokenRow key={symbol} symbol={symbol} walletBalance={balData.wallet || "0"} agentBalance={balData.agent_wallet || "0"} />
              );
            })}
          </div>
        )}

        {/* Liquidity Positions */}
        {activeTab === "liquidity" && (
          <div className="space-y-3">
            {portfolio?.lp_positions && portfolio.lp_positions.length > 0 ? (
              portfolio.lp_positions.map((lp, i) => (
                <div key={i} className="p-5 rounded-xl tech-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-md border border-polka-pink/15 bg-polka-pink/[0.05] flex items-center justify-center text-polka-pink font-mono text-[10px] font-bold">P</div>
                        <div className="w-8 h-8 rounded-md border border-emerald-500/15 bg-emerald-500/[0.05] flex items-center justify-center text-emerald-400 font-mono text-[10px] font-bold">$</div>
                      </div>
                      <div>
                        <h3 className="font-display text-white font-semibold tracking-wide">{lp.pair || "PAS/USDT"}</h3>
                        <p className="font-mono text-[8px] text-polka-text/40 uppercase tracking-wider">Uniswap V2 LP</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[8px] px-2.5 py-1 rounded-md border border-emerald-500/15 bg-emerald-500/[0.03] text-emerald-400 uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-polka-border bg-polka-darker">
                      <p className="font-mono text-[8px] text-polka-text/40 uppercase tracking-wider mb-1">PAS Pooled</p>
                      <p className="font-mono text-white text-sm">{formatBalance(lp.reserve_pas || "0")}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-polka-border bg-polka-darker">
                      <p className="font-mono text-[8px] text-polka-text/40 uppercase tracking-wider mb-1">Token Pooled</p>
                      <p className="font-mono text-white text-sm">{formatBalance(Object.values(lp).find((v) => v !== lp.pair && v !== lp.pair_address && v !== lp.reserve_pas) as string || "0")}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <Droplets size={40} className="mx-auto text-polka-text/10 mb-4" />
                <h3 className="font-display text-white font-semibold mb-2 tracking-wide">No Liquidity Positions</h3>
                <p className="font-mono text-polka-text/40 text-[10px] uppercase tracking-wider mb-4">Add liquidity to earn trading fees</p>
                <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-polka-border bg-polka-card text-polka-text hover:text-polka-pink font-mono text-[10px] uppercase tracking-wider transition-all">
                  <ArrowRightLeft size={12} /> Go to Chat
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Transaction History */}
        {activeTab === "history" && (
          <div className="text-center py-16">
            <Clock size={40} className="mx-auto text-polka-text/10 mb-4" />
            <h3 className="font-display text-white font-semibold mb-2 tracking-wide">Transaction History</h3>
            <p className="font-mono text-polka-text/40 text-[10px] uppercase tracking-wider mb-4">
              View your transactions on the block explorer
            </p>
            <a
              href={`https://blockscout-testnet.polkadot.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-polka-border bg-polka-card text-polka-text hover:text-polka-pink font-mono text-[10px] uppercase tracking-wider transition-all"
            >
              View on Blockscout <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function TokenRow({
  symbol,
  walletBalance,
  agentBalance,
}: {
  symbol: string;
  walletBalance: string;
  agentBalance: string;
}) {
  const meta = TOKEN_META[symbol] || { color: "border-polka-border bg-polka-darker text-polka-text", icon: symbol[0] };
  const total = parseFloat(walletBalance) + parseFloat(agentBalance);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl tech-card group">
      <div className={`w-10 h-10 rounded-md border ${meta.color} flex items-center justify-center font-mono text-sm font-bold`}>
        {meta.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-white font-semibold tracking-wide">{symbol}</h3>
            <p className="font-mono text-[8px] text-polka-text/40 uppercase tracking-wider">
              {symbol === "PAS" ? "Polkadot Hub" : symbol === "USDT" ? "Tether USD" : "USD Coin"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-white font-semibold">{formatBalance(String(total))}</p>
            {parseFloat(agentBalance) > 0 && (
              <p className="font-mono text-[9px] text-polka-text/40 mt-0.5">
                <span className="text-polka-text/30">Wallet:</span> {formatBalance(walletBalance)} &middot;{" "}
                <span className="text-emerald-400/50">Agent:</span> {formatBalance(agentBalance)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
