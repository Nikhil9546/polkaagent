"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Globe,
  TrendingUp,
  ArrowRightLeft,
  RefreshCw,
  Zap,
  ExternalLink,
  ChevronRight,
  Activity,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useMounted } from "@/hooks/useMounted";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Opportunity {
  token: string;
  buy_chain: string;
  buy_price: number;
  buy_dex: string;
  sell_chain: string;
  sell_price: number;
  sell_dex: string;
  spread_pct: number;
  estimated_profit_usd: number;
  trade_size_usd: number;
  route: string;
}

const CHAIN_COLORS: Record<string, string> = {
  "Polkadot Hub": "border-polka-pink/15 bg-polka-pink/[0.05] text-polka-pink",
  "Hydration": "border-cyan-500/15 bg-cyan-500/[0.05] text-cyan-400",
  "Moonbeam": "border-purple-500/15 bg-purple-500/[0.05] text-purple-400",
  "Acala": "border-red-500/15 bg-red-500/[0.05] text-red-400",
  "Astar": "border-blue-500/15 bg-blue-500/[0.05] text-blue-400",
  "Bifrost": "border-green-500/15 bg-green-500/[0.05] text-green-400",
};

const CHAIN_BORDER_COLORS: Record<string, string> = {
  "Polkadot Hub": "border-polka-pink/15 bg-polka-pink/[0.05]",
  "Hydration": "border-cyan-500/15 bg-cyan-500/[0.05]",
  "Moonbeam": "border-purple-500/15 bg-purple-500/[0.05]",
  "Acala": "border-red-500/15 bg-red-500/[0.05]",
  "Astar": "border-blue-500/15 bg-blue-500/[0.05]",
  "Bifrost": "border-green-500/15 bg-green-500/[0.05]",
};

export default function XCMPage() {
  const mounted = useMounted();
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [priceRes, arbRes] = await Promise.all([
        fetch(`${API}/xcm/prices`),
        fetch(`${API}/xcm/arbitrage?min_spread=0.5`),
      ]);
      if (priceRes.ok) setPrices(await priceRes.json());
      if (arbRes.ok) {
        const data = await arbRes.json();
        setOpportunities(data.opportunities || []);
      }
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchData]);

  if (!mounted) return <div className="min-h-screen bg-polka-dark" />;

  const totalProfit = opportunities.reduce((sum, o) => sum + o.estimated_profit_usd, 0);
  const bestSpread = opportunities.length > 0 ? Math.max(...opportunities.map(o => o.spread_pct)) : 0;
  const chainCount = Object.keys(prices).length;

  return (
    <div className="min-h-screen bg-polka-dark grid-bg scanlines">
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border glass sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-polka-pink/[0.03] text-polka-text hover:text-polka-pink transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <Globe size={18} className="text-polka-pink" /> XCM Cross-Chain Arbitrage
            </h1>
            <p className="font-mono text-[8px] text-polka-text/70 uppercase tracking-[0.2em]">AI-Powered Cross-Chain Opportunity Detection</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} disabled={isLoading} className="p-2 rounded-lg hover:bg-polka-pink/[0.03] text-polka-text hover:text-polka-pink transition-all">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Summary Hero Card */}
        <div className="relative overflow-hidden rounded-xl tech-card corner-accents p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-polka-pink/[0.03] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-polka-purple/[0.03] rounded-full blur-[80px]" />
          <div className="relative">
            <p className="tech-label text-polka-text/80 mb-2">Cross-Chain Overview</p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="num-display text-3xl text-white">{opportunities.length}</p>
                <p className="font-mono text-[9px] text-polka-text/60 uppercase tracking-wider mt-1">Opportunities</p>
              </div>
              <div>
                <p className="num-display text-3xl text-emerald-400">
                  {totalProfit > 0 ? `+$${totalProfit.toFixed(0)}` : "$0"}
                </p>
                <p className="font-mono text-[9px] text-polka-text/60 uppercase tracking-wider mt-1">Total Est. Profit</p>
              </div>
              <div>
                <p className="num-display text-3xl text-polka-pink">
                  {bestSpread > 0 ? `${bestSpread.toFixed(1)}%` : "0%"}
                </p>
                <p className="font-mono text-[9px] text-polka-text/60 uppercase tracking-wider mt-1">Best Spread</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 font-mono text-[10px] text-polka-text/70 uppercase tracking-wider">
                <Activity size={12} />
                <span>Scanning {chainCount} parachains</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-400/70 uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div>
          <h2 className="tech-label text-polka-text/80 flex items-center gap-2 mb-4">
            <Zap size={12} className="text-amber-400" /> Arbitrage Opportunities ({opportunities.length})
          </h2>

          {opportunities.length > 0 ? (
            <div className="space-y-3">
              {opportunities.map((opp, i) => (
                <div key={i} className={`p-5 rounded-xl border ${opp.spread_pct >= 100 ? "border-emerald-500/15 bg-emerald-500/[0.02]" : opp.spread_pct >= 10 ? "border-amber-500/15 bg-amber-500/[0.02]" : "tech-card"} corner-accents`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md border ${CHAIN_BORDER_COLORS[opp.buy_chain] || "border-polka-border bg-polka-darker"} flex items-center justify-center font-mono text-sm font-bold text-white`}>
                        {opp.token[0]}
                      </div>
                      <div>
                        <h3 className="font-display text-[15px] font-semibold text-white tracking-wide">{opp.token}</h3>
                        <p className="font-mono text-[9px] text-polka-text/70 uppercase tracking-[0.2em]">{opp.spread_pct.toFixed(2)}% spread</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="num-display text-[18px] font-bold text-emerald-400">+{opp.spread_pct ?? 0}%</p>
                      <p className="font-mono text-[8px] text-polka-text/50 uppercase tracking-wider">est. profit</p>
                    </div>
                  </div>

                  {/* Route visualization */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`px-3 py-1.5 rounded-md border ${CHAIN_COLORS[opp.buy_chain] || "border-polka-border bg-polka-darker text-polka-text"} text-[11px] font-medium font-mono`}>
                      {opp.buy_chain}
                    </div>
                    <div className="flex items-center gap-1 text-polka-text/40">
                      <span className="font-mono text-[9px] tracking-wider">Buy @ ${(opp.buy_price ?? 0).toFixed(4)}</span>
                      <ArrowRightLeft size={12} />
                      <span className="font-mono text-[9px] tracking-wider text-polka-pink/60">XCM</span>
                      <ArrowRightLeft size={12} />
                      <span className="font-mono text-[9px] tracking-wider">Sell @ ${(opp.sell_price ?? 0).toFixed(4)}</span>
                    </div>
                    <div className={`px-3 py-1.5 rounded-md border ${CHAIN_COLORS[opp.sell_chain] || "border-polka-border bg-polka-darker text-polka-text"} text-[11px] font-medium font-mono`}>
                      {opp.sell_chain}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-lg bg-polka-darker border border-polka-border">
                      <p className="font-mono text-[8px] text-polka-text/60 uppercase tracking-[0.2em]">Buy on</p>
                      <p className="text-[12px] text-white font-medium mt-1">{opp.buy_dex}</p>
                      <p className="font-mono text-[11px] text-polka-text/70 tracking-wider">${(opp.buy_price ?? 0).toFixed(4)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-polka-darker border border-polka-border">
                      <p className="font-mono text-[8px] text-polka-text/60 uppercase tracking-[0.2em]">Sell on</p>
                      <p className="text-[12px] text-white font-medium mt-1">{opp.sell_dex}</p>
                      <p className="font-mono text-[11px] text-polka-text/70 tracking-wider">${(opp.sell_price ?? 0).toFixed(4)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-polka-darker border border-polka-border">
                      <p className="font-mono text-[8px] text-polka-text/60 uppercase tracking-[0.2em]">Spread</p>
                      <p className="font-mono text-[12px] text-emerald-400 font-medium mt-1">+{opp.spread_pct ?? 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Globe size={40} className="mx-auto text-polka-text/30 mb-4" />
              <h3 className="font-display text-white font-semibold mb-2 tracking-wide">No Arbitrage Opportunities</h3>
              <p className="font-mono text-polka-text/70 text-[10px] uppercase tracking-wider mb-4">Scanning {chainCount} parachains every 15 seconds</p>
            </div>
          )}
        </div>

        {/* Cross-Chain Prices Grid */}
        <div>
          <h2 className="tech-label text-polka-text/80 flex items-center gap-2 mb-4">
            <BarChart3 size={12} className="text-polka-pink" /> Cross-Chain Prices
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(prices).map(([chain, info]: [string, any]) => (
              <div key={chain} className="p-5 rounded-xl tech-card corner-accents">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-md border ${CHAIN_COLORS[chain] || "border-polka-border bg-polka-darker text-polka-text"} flex items-center justify-center text-[10px] font-bold font-mono`}>
                    {chain[0]}
                  </div>
                  <div>
                    <h3 className="font-display text-[13px] font-semibold text-white">{chain}</h3>
                    <p className="font-mono text-[8px] text-polka-text/50 uppercase tracking-[0.2em]">{info.dex} | Para ID: {info.para_id}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(info.tokens || {}).map(([token, data]: [string, any]) => (
                    <div key={token} className="flex justify-between items-center p-1.5 rounded-lg hover:bg-polka-pink/[0.02] transition-all">
                      <span className="font-mono text-[11px] text-polka-text/60 uppercase tracking-wider">{token}</span>
                      <span className="text-white font-mono text-[11px] tracking-wider">${data.price_usd?.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
