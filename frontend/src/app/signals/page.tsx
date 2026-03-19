"use client";

import { useAccount } from "wagmi";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  RefreshCw,
  ArrowRightLeft,
  Check,
  Clock,
  Loader2,
  Bot,
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useMounted } from "@/hooks/useMounted";

interface Signal {
  signal_type: string;
  token: string;
  strength: string;
  reason: string;
  current_price: string;
  change_pct: string;
  recommended_action: string;
  timestamp: number;
}

interface TradeResult {
  trade: { from: string; to: string; amount: string };
  result: { tx_hash?: string; status?: string; success?: boolean; description?: string };
  signal: Signal;
}

const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  BUY: <TrendingUp size={14} />,
  SELL: <TrendingDown size={14} />,
  HOLD: <Clock size={14} />,
  ALERT: <AlertTriangle size={14} />,
};

const SIGNAL_COLORS: Record<string, string> = {
  BUY: "text-emerald-400 bg-emerald-500/[0.03] border-emerald-500/10",
  SELL: "text-red-400 bg-red-500/[0.03] border-red-500/10",
  HOLD: "text-yellow-400 bg-yellow-500/[0.03] border-yellow-500/10",
  ALERT: "text-orange-400 bg-orange-500/[0.03] border-orange-500/10",
};

const STRENGTH_DOTS: Record<string, string> = {
  STRONG: "bg-emerald-400",
  MODERATE: "bg-yellow-400",
  WEAK: "bg-polka-text/30",
};

export default function SignalsPage() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeResults, setTradeResults] = useState<TradeResult[]>([]);

  const fetchSignals = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiBase}/signals`);
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals || []);
        setPrices(data.prices || {});
      }
    } catch (err) {
      console.error("Failed to fetch signals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeAutoTrade = async () => {
    if (!address) return;
    setIsTrading(true);
    setTradeResults([]);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiBase}/signals/auto-trade?wallet_address=${address}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setTradeResults(data.executed_trades || []);
        fetchSignals();
      }
    } catch (err) {
      console.error("Auto-trade failed:", err);
    } finally {
      setIsTrading(false);
    }
  };

  useEffect(() => {
    if (mounted) fetchSignals();
  }, [mounted, fetchSignals]);

  if (!mounted) return <div className="min-h-screen bg-polka-dark" />;

  return (
    <div className="min-h-screen bg-polka-dark grid-bg scanlines">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border glass sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-polka-pink/[0.03] text-polka-text hover:text-polka-pink transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-white tracking-wide">Trading Signals</h1>
            <p className="font-mono text-[8px] text-polka-text/40 uppercase tracking-[0.2em]">AI-Powered Market Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSignals}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-polka-pink/[0.03] text-polka-text hover:text-polka-pink transition-all"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Prices */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(prices).map(([token, data]: [string, any]) => (
            <div key={token} className="p-5 rounded-xl tech-card corner-accents">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[9px] text-polka-text/40 uppercase tracking-[0.2em]">PAS / {token}</span>
                <span className="font-mono text-[8px] px-2 py-0.5 rounded-md border border-polka-border bg-polka-darker text-polka-text/40 uppercase tracking-wider">DEX</span>
              </div>
              <p className="num-display text-3xl text-white">
                {parseFloat(data.price_in_pas).toFixed(4)}
              </p>
              <p className="font-mono text-[10px] text-polka-text/40 mt-1 tracking-wider">
                ${parseFloat(data.price_in_usd).toFixed(4)} USD
              </p>
              <div className="flex gap-4 mt-3 font-mono text-[9px] text-polka-text/30 tracking-wider">
                <span>PAS: {parseFloat(data.reserve_pas).toFixed(1)}</span>
                <span>{token}: {parseFloat(data.reserve_token).toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Auto Trade Button */}
        {isConnected && (
          <button
            onClick={executeAutoTrade}
            disabled={isTrading || signals.length === 0}
            className="w-full py-4 rounded-xl border border-polka-pink/20 bg-polka-pink/10 text-polka-pink font-mono text-sm font-semibold uppercase tracking-wider
              disabled:opacity-20 hover:bg-polka-pink/15 transition-all
              flex items-center justify-center gap-3"
          >
            {isTrading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                AI is executing trades...
              </>
            ) : (
              <>
                <Bot size={18} />
                Auto-Trade Based on Signals
              </>
            )}
          </button>
        )}

        {/* Trade Results */}
        {tradeResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="tech-label text-polka-text/50 flex items-center gap-2">
              <Check size={12} className="text-emerald-400" />
              Executed Trades
            </h3>
            {tradeResults.map((tr, i) => (
              <div key={i} className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft size={12} className="text-emerald-400" />
                    <span className="font-display text-sm text-white tracking-wide">
                      {tr.trade.amount} {tr.trade.from} &rarr; {tr.trade.to}
                    </span>
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-wider ${tr.result.success ? "text-emerald-400" : "text-red-400"}`}>
                    {tr.result.status}
                  </span>
                </div>
                {tr.result.tx_hash && (
                  <a
                    href={`https://blockscout-testnet.polkadot.io/tx/0x${tr.result.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[9px] text-polka-pink/40 hover:text-polka-pink mt-1 block tracking-wider"
                  >
                    {tr.result.tx_hash.slice(0, 16)}...
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Signals */}
        <div className="space-y-2">
          <h3 className="tech-label text-polka-text/50 flex items-center gap-2">
            <Zap size={12} />
            Active Signals ({signals.length})
          </h3>

          {signals.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp size={40} className="mx-auto text-polka-text/10 mb-4" />
              <p className="font-mono text-polka-text/30 text-[10px] uppercase tracking-wider">No signals right now. Market is stable.</p>
              <p className="font-mono text-polka-text/15 text-[9px] mt-2 tracking-wider">Signals are generated from DEX pool analysis</p>
            </div>
          ) : (
            signals.map((signal, i) => (
              <div
                key={i}
                className={`p-5 rounded-xl border ${SIGNAL_COLORS[signal.signal_type] || SIGNAL_COLORS.HOLD}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {SIGNAL_ICONS[signal.signal_type]}
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{signal.signal_type}</span>
                    <span className="font-display text-white font-semibold tracking-wide">{signal.token}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${STRENGTH_DOTS[signal.strength] || STRENGTH_DOTS.WEAK}`} />
                    <span className="font-mono text-[8px] text-polka-text/40 uppercase tracking-wider">{signal.strength}</span>
                  </div>
                </div>
                <p className="text-[13px] text-polka-text/60 mb-2 leading-relaxed">{signal.reason}</p>
                <div className="flex items-center justify-between font-mono text-[10px] tracking-wider">
                  <span className="text-polka-text/40">
                    Price: {parseFloat(signal.current_price).toFixed(4)} PAS
                  </span>
                  <span className="text-polka-text/30">{signal.change_pct}</span>
                </div>
                <div className="mt-2 p-2.5 rounded-lg border border-polka-border bg-polka-darker font-mono text-[10px] text-polka-text/40 tracking-wider">
                  {signal.recommended_action}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
