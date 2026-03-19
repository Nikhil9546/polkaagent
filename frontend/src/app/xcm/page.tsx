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
    <div className="min-h-screen gradient-bg">
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border/30 glass sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-polka-card text-polka-text hover:text-white transition-smooth">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe size={20} className="text-polka-pink" /> XCM Cross-Chain Arbitrage
            </h1>
            <p className="text-[10px] text-polka-text/40">AI-powered cross-chain opportunity detection via Polkadot XCM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={isLoading} className="p-2 rounded-lg hover:bg-white/[0.04] text-polka-text/50 hover:text-white transition-smooth">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Opportunities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Arbitrage Opportunities ({opportunities.length})
            </h2>
          </div>

          {opportunities.length > 0 ? (
            <div className="space-y-3">
              {opportunities.map((opp, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-polka-border/20 hover:border-polka-pink/15 transition-smooth card-shine">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {opp.token[0]}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-white">{opp.token}</h3>
                        <p className="text-[11px] text-polka-text/40">{opp.spread_pct}% spread</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[18px] font-bold text-emerald-400 font-mono">+${opp.estimated_profit_usd}</p>
                      <p className="text-[10px] text-polka-text/30">est. profit</p>
                    </div>
                  </div>

                  {/* Route visualization */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${CHAIN_COLORS[opp.buy_chain] || "from-gray-500 to-gray-600"} text-white text-[11px] font-medium`}>
                      {opp.buy_chain}
                    </div>
                    <div className="flex items-center gap-1 text-polka-text/30">
                      <span className="text-[10px]">Buy @ ${opp.buy_price.toFixed(4)}</span>
                      <ArrowRightLeft size={12} />
                      <span className="text-[10px]">XCM</span>
                      <ArrowRightLeft size={12} />
                      <span className="text-[10px]">Sell @ ${opp.sell_price.toFixed(4)}</span>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${CHAIN_COLORS[opp.sell_chain] || "from-gray-500 to-gray-600"} text-white text-[11px] font-medium`}>
                      {opp.sell_chain}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-lg bg-white/[0.02]">
                      <p className="text-[9px] text-polka-text/30 uppercase tracking-wider">Buy on</p>
                      <p className="text-[12px] text-white font-medium">{opp.buy_dex}</p>
                      <p className="text-[11px] text-polka-text/50 font-mono">${opp.buy_price.toFixed(4)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/[0.02]">
                      <p className="text-[9px] text-polka-text/30 uppercase tracking-wider">Sell on</p>
                      <p className="text-[12px] text-white font-medium">{opp.sell_dex}</p>
                      <p className="text-[11px] text-polka-text/50 font-mono">${opp.sell_price.toFixed(4)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/[0.02]">
                      <p className="text-[9px] text-polka-text/30 uppercase tracking-wider">Trade Size</p>
                      <p className="text-[12px] text-white font-medium font-mono">${opp.trade_size_usd.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-400 font-mono">+{opp.spread_pct}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-polka-border/20">
              <Globe size={32} className="mx-auto text-polka-text/10 mb-3" />
              <p className="text-polka-text/40 text-[13px]">No significant cross-chain arbitrage right now</p>
              <p className="text-polka-text/20 text-[11px] mt-1">Scanning 6 parachains every 15 seconds</p>
            </div>
          )}
        </div>

        {/* Cross-Chain Prices Grid */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Globe size={14} /> Cross-Chain Prices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(prices).map(([chain, info]: [string, any]) => (
              <div key={chain} className="p-4 rounded-2xl bg-white/[0.02] border border-polka-border/20 card-shine">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${CHAIN_COLORS[chain] || "from-gray-500 to-gray-600"} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {chain[0]}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-white">{chain}</h3>
                    <p className="text-[9px] text-polka-text/30">{info.dex} | Para ID: {info.para_id}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(info.tokens || {}).map(([token, data]: [string, any]) => (
                    <div key={token} className="flex justify-between text-[11px]">
                      <span className="text-polka-text/50">{token}</span>
                      <span className="text-white font-mono">${data.price_usd?.toFixed(4)}</span>
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
