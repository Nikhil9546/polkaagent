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
  BUY: <TrendingUp size={16} />,
  SELL: <TrendingDown size={16} />,
  HOLD: <Clock size={16} />,
  ALERT: <AlertTriangle size={16} />,
};

const SIGNAL_COLORS: Record<string, string> = {
  BUY: "text-green-400 bg-green-500/10 border-green-500/20",
  SELL: "text-red-400 bg-red-500/10 border-red-500/20",
  HOLD: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  ALERT: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

const STRENGTH_DOTS: Record<string, string> = {
  STRONG: "bg-green-400",
  MODERATE: "bg-yellow-400",
  WEAK: "bg-gray-400",
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
        // Refresh signals after trading
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
    <div className="min-h-screen bg-polka-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border glass sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-polka-card text-polka-text hover:text-white transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Trading Signals</h1>
            <p className="text-[10px] text-polka-text">AI-powered market analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSignals}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-polka-card text-polka-text hover:text-white transition-all"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(prices).map(([token, data]: [string, any]) => (
            <div key={token} className="p-5 rounded-2xl bg-polka-card border border-polka-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-polka-text">PAS / {token}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-polka-dark text-polka-text">DEX</span>
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                {parseFloat(data.price_in_pas).toFixed(4)}
              </p>
              <p className="text-xs text-polka-text mt-1">
                ${parseFloat(data.price_in_usd).toFixed(4)} USD
              </p>
              <div className="flex gap-4 mt-3 text-[10px] text-polka-text">
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
            className="w-full py-4 rounded-xl bg-gradient-to-r from-polka-pink to-polka-purple text-white font-bold text-lg
              disabled:opacity-30 hover:opacity-90 transition-all shadow-lg shadow-polka-pink/20
              flex items-center justify-center gap-3"
          >
            {isTrading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                AI is executing trades...
              </>
            ) : (
              <>
                <Bot size={22} />
                Auto-Trade Based on Signals
              </>
            )}
          </button>
        )}

        {/* Trade Results */}
        {tradeResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-polka-text uppercase tracking-wider flex items-center gap-2">
              <Check size={14} className="text-green-400" />
              Executed Trades
            </h3>
            {tradeResults.map((tr, i) => (
              <div key={i} className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft size={14} className="text-green-400" />
                    <span className="text-sm text-white">
                      {tr.trade.amount} {tr.trade.from} → {tr.trade.to}
                    </span>
                  </div>
                  <span className={`text-xs ${tr.result.success ? "text-green-400" : "text-red-400"}`}>
                    {tr.result.status}
                  </span>
                </div>
                {tr.result.tx_hash && (
                  <a
                    href={`https://blockscout-testnet.polkadot.io/tx/0x${tr.result.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-polka-pink hover:underline mt-1 block font-mono"
                  >
                    {tr.result.tx_hash.slice(0, 16)}...
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Signals */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-polka-text uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} />
            Active Signals ({signals.length})
          </h3>

          {signals.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp size={48} className="mx-auto text-polka-text/20 mb-4" />
              <p className="text-polka-text">No signals right now. Market is stable.</p>
              <p className="text-xs text-polka-text/50 mt-2">Signals are generated from DEX pool analysis</p>
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
                    <span className="font-bold text-sm">{signal.signal_type}</span>
                    <span className="text-white font-semibold">{signal.token}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STRENGTH_DOTS[signal.strength] || STRENGTH_DOTS.WEAK}`} />
                    <span className="text-xs text-polka-text">{signal.strength}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-2">{signal.reason}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-polka-text">
                    Price: {parseFloat(signal.current_price).toFixed(4)} PAS
                  </span>
                  <span className="font-mono">{signal.change_pct}</span>
                </div>
                <div className="mt-2 p-2 rounded-lg bg-polka-dark/50 text-xs text-polka-text">
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
