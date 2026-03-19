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
  "Polkadot Hub": "from-polka-pink to-polka-purple",
  "Hydration": "from-blue-500 to-cyan-500",
  "Moonbeam": "from-purple-500 to-indigo-500",
  "Acala": "from-red-500 to-orange-500",
  "Astar": "from-blue-600 to-violet-500",
  "Bifrost": "from-green-500 to-emerald-500",
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
        {/* Opportunities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Arbitrage Opportunities ({opportunities.length})
            </h2>
          </div>

          {opportunities.length > 0 ? (
            <div className="space-y-3">
              {opportunities.map((opp, i) => (
                <div key={i} className="p-5 rounded-xl tech-card corner-accents">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {opp.token[0]}
                      </div>
                      <div>
                        <h3 className="font-display text-[15px] font-semibold text-white">{opp.token}</h3>
                        <p className="font-mono text-[9px] text-polka-text/70 uppercase tracking-[0.2em]">{opp.spread_pct}% spread</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="num-display text-[18px] font-bold text-emerald-400">+${opp.estimated_profit_usd}</p>
                      <p className="font-mono text-[8px] text-polka-text/50 uppercase tracking-wider">est. profit</p>
                    </div>
                  </div>

                  {/* Route visualization */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${CHAIN_COLORS[opp.buy_chain] || "from-gray-500 to-gray-600"} text-white text-[11px] font-medium`}>
                      {opp.buy_chain}
                    </div>
                    <div className="flex items-center gap-1 text-polka-text/40">
                      <span className="font-mono text-[9px] tracking-wider">Buy @ ${opp.buy_price.toFixed(4)}</span>
                      <ArrowRightLeft size={12} />
                      <span className="font-mono text-[9px] tracking-wider text-polka-pink/60">XCM</span>
                      <ArrowRightLeft size={12} />
                      <span className="font-mono text-[9px] tracking-wider">Sell @ ${opp.sell_price.toFixed(4)}</span>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${CHAIN_COLORS[opp.sell_chain] || "from-gray-500 to-gray-600"} text-white text-[11px] font-medium`}>
                      {opp.sell_chain}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-lg bg-polka-darker border border-polka-border">
                      <p className="font-mono text-[8px] text-polka-text/60 uppercase tracking-[0.2em]">Buy on</p>
                      <p className="text-[12px] text-white font-medium mt-1">{opp.buy_dex}</p>
                      <p className="font-mono text-[11px] text-polka-text/70 tracking-wider">${opp.buy_price.toFixed(4)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-polka-darker border border-polka-border">
                      <p className="font-mono text-[8px] text-polka-text/60 uppercase tracking-[0.2em]">Sell on</p>
                      <p className="text-[12px] text-white font-medium mt-1">{opp.sell_dex}</p>
                      <p className="font-mono text-[11px] text-polka-text/70 tracking-wider">${opp.sell_price.toFixed(4)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-polka-darker border border-polka-border">
                      <p className="font-mono text-[8px] text-polka-text/60 uppercase tracking-[0.2em]">Trade Size</p>
                      <p className="font-mono text-[12px] text-white font-medium mt-1">${opp.trade_size_usd.toLocaleString()}</p>
                      <p className="font-mono text-[11px] text-emerald-400 tracking-wider">+{opp.spread_pct}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl tech-card">
              <Globe size={32} className="mx-auto text-polka-text/20 mb-3" />
              <p className="font-display text-polka-text/50 text-[13px]">No significant cross-chain arbitrage right now</p>
              <p className="font-mono text-[9px] text-polka-text/30 mt-1 uppercase tracking-[0.2em]">Scanning 6 parachains every 15 seconds</p>
            </div>
          )}
        </div>

        {/* Cross-Chain Prices Grid */}
        <div>
          <h2 className="font-display text-sm font-semibold text-white tracking-wide mb-4 flex items-center gap-2">
            <Globe size={14} className="text-polka-pink" /> Cross-Chain Prices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(prices).map(([chain, info]: [string, any]) => (
              <div key={chain} className="p-5 rounded-xl tech-card corner-accents">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${CHAIN_COLORS[chain] || "from-gray-500 to-gray-600"} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {chain[0]}
                  </div>
                  <div>
                    <h3 className="font-display text-[13px] font-semibold text-white">{chain}</h3>
                    <p className="font-mono text-[8px] text-polka-text/50 uppercase tracking-[0.2em]">{info.dex} | Para ID: {info.para_id}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(info.tokens || {}).map(([token, data]: [string, any]) => (
                    <div key={token} className="flex justify-between text-[11px]">
                      <span className="font-mono text-polka-text/60 uppercase tracking-wider">{token}</span>
                      <span className="text-white font-mono tracking-wider">${data.price_usd?.toFixed(4)}</span>
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
