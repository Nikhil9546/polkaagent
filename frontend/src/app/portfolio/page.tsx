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
  PAS: { color: "from-polka-pink to-polka-purple", icon: "P" },
  USDT: { color: "from-green-500 to-emerald-500", icon: "$" },
  USDC: { color: "from-blue-500 to-cyan-500", icon: "$" },
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
      <div className="min-h-screen bg-polka-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <Wallet size={48} className="mx-auto text-polka-text" />
          <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-polka-text text-sm">Connect to view your portfolio</p>
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
            <h1 className="text-lg font-bold text-white">Portfolio</h1>
            <p className="text-[10px] text-polka-text">Polkadot Hub TestNet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-polka-card text-polka-text hover:text-white transition-all"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Total Balance Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-polka-pink/10 via-polka-card to-polka-purple/10 border border-polka-border p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-polka-pink/5 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-polka-text text-sm mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold text-white mb-1">
              {formatBalance(nativeBalance?.formatted || "0", 4)} <span className="text-2xl text-polka-text">PAS</span>
            </h2>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-xs text-polka-text">
                <Wallet size={14} />
                <span className="font-mono">{shortenAddress(address!, 6)}</span>
              </div>
              {agentWallet && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <Shield size={14} />
                  <span>Agent Wallet Active</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-polka-card border border-polka-border">
          {(["tokens", "liquidity", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all capitalize
                ${activeTab === tab
                  ? "bg-gradient-to-r from-polka-pink to-polka-purple text-white shadow-lg"
                  : "text-polka-text hover:text-white"
                }`}
            >
              {tab === "tokens" && <span className="flex items-center justify-center gap-1.5"><Wallet size={14} /> Tokens</span>}
              {tab === "liquidity" && <span className="flex items-center justify-center gap-1.5"><Droplets size={14} /> Liquidity</span>}
              {tab === "history" && <span className="flex items-center justify-center gap-1.5"><Clock size={14} /> History</span>}
            </button>
          ))}
        </div>

        {/* Token Balances */}
        {activeTab === "tokens" && (
          <div className="space-y-3">
            {/* Native PAS */}
            <TokenRow
              symbol="PAS"
              walletBalance={nativeBalance?.formatted || "0"}
              agentBalance="0"
            />
            {portfolio?.token_balances && Object.entries(portfolio.token_balances).map(([symbol, data]) => {
              if (symbol === "PAS") return null;
              const balData = typeof data === "string" ? { wallet: data, agent_wallet: "0" } : data;
              return (
                <TokenRow
                  key={symbol}
                  symbol={symbol}
                  walletBalance={balData.wallet || "0"}
                  agentBalance={balData.agent_wallet || "0"}
                />
              );
            })}
          </div>
        )}

        {/* Liquidity Positions */}
        {activeTab === "liquidity" && (
          <div className="space-y-3">
            {portfolio?.lp_positions && portfolio.lp_positions.length > 0 ? (
              portfolio.lp_positions.map((lp, i) => (
                <div key={i} className="p-5 rounded-xl bg-polka-card border border-polka-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-polka-pink to-polka-purple flex items-center justify-center text-white text-xs font-bold border-2 border-polka-card">P</div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold border-2 border-polka-card">$</div>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{lp.pair || "PAS/USDT"}</h3>
                        <p className="text-xs text-polka-text">Uniswap V2 LP</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-polka-dark/50">
                      <p className="text-xs text-polka-text mb-1">PAS Pooled</p>
                      <p className="text-white font-mono text-sm">{formatBalance(lp.reserve_pas || "0")}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-polka-dark/50">
                      <p className="text-xs text-polka-text mb-1">Token Pooled</p>
                      <p className="text-white font-mono text-sm">{formatBalance(Object.values(lp).find((v) => v !== lp.pair && v !== lp.pair_address && v !== lp.reserve_pas) as string || "0")}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <Droplets size={48} className="mx-auto text-polka-text/30 mb-4" />
                <h3 className="text-white font-semibold mb-2">No Liquidity Positions</h3>
                <p className="text-polka-text text-sm mb-4">Add liquidity to earn trading fees</p>
                <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-polka-card border border-polka-border text-polka-text hover:text-white transition-all text-sm">
                  <ArrowRightLeft size={14} /> Go to Chat to Add Liquidity
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Transaction History */}
        {activeTab === "history" && (
          <div className="text-center py-16">
            <Clock size={48} className="mx-auto text-polka-text/30 mb-4" />
            <h3 className="text-white font-semibold mb-2">Transaction History</h3>
            <p className="text-polka-text text-sm mb-4">
              View your transactions on the block explorer
            </p>
            <a
              href={`https://blockscout-testnet.polkadot.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-polka-card border border-polka-border text-polka-text hover:text-white transition-all text-sm"
            >
              View on Blockscout <ExternalLink size={14} />
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
  const meta = TOKEN_META[symbol] || { color: "from-gray-500 to-gray-600", icon: symbol[0] };
  const total = parseFloat(walletBalance) + parseFloat(agentBalance);

  return (
    <div className="flex items-center gap-4 p-5 rounded-xl bg-polka-card border border-polka-border hover:border-polka-border/80 transition-all group">
      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${meta.color} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
        {meta.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">{symbol}</h3>
            <p className="text-xs text-polka-text">
              {symbol === "PAS" ? "Polkadot Hub" : symbol === "USDT" ? "Tether USD" : "USD Coin"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white font-mono font-semibold">{formatBalance(String(total))}</p>
            {parseFloat(agentBalance) > 0 && (
              <p className="text-[10px] text-polka-text mt-0.5">
                <span className="text-polka-text/70">Wallet:</span> {formatBalance(walletBalance)} &middot;{" "}
                <span className="text-green-400/70">Agent:</span> {formatBalance(agentBalance)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
