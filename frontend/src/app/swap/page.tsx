"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowDownUp,
  Loader2,
  Info,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useMounted } from "@/hooks/useMounted";
import { formatBalance } from "@/lib/utils";

const TOKENS = [
  { symbol: "PAS", name: "Polkadot Hub", color: "border-polka-pink/15 bg-polka-pink/[0.05] text-polka-pink", icon: "P" },
  { symbol: "USDT", name: "Tether USD", color: "border-emerald-500/15 bg-emerald-500/[0.05] text-emerald-400", icon: "$" },
  { symbol: "USDC", name: "USD Coin", color: "border-blue-500/15 bg-blue-500/[0.05] text-blue-400", icon: "$" },
];

export default function SwapPage() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const [fromToken, setFromToken] = useState("PAS");
  const [toToken, setToToken] = useState("USDT");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);

  const fromMeta = TOKENS.find((t) => t.symbol === fromToken)!;
  const toMeta = TOKENS.find((t) => t.symbol === toToken)!;

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const fetchQuote = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setToAmount("");
      return;
    }
    setIsQuoting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiBase}/quote/${fromToken}/${toToken}/${amount}`);
      if (res.ok) {
        const data = await res.json();
        setToAmount(data.amount_out);
      }
    } catch {
    } finally {
      setIsQuoting(false);
    }
  };

  const handleFromAmountChange = (val: string) => {
    setFromAmount(val);
    if (val) {
      const timeout = setTimeout(() => fetchQuote(val), 500);
      return () => clearTimeout(timeout);
    } else {
      setToAmount("");
    }
  };

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
            <h1 className="font-display text-lg font-bold text-white tracking-wide">Swap</h1>
            <p className="font-mono text-[8px] text-polka-text/40 uppercase tracking-[0.2em]">Trade Tokens on Polkadot Hub</p>
          </div>
        </div>
        <ConnectButton />
      </header>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-xl tech-card corner-accents p-6 space-y-4 glow-pink">
          {/* From */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[9px] text-polka-text/40 uppercase tracking-wider">
              <span>You pay</span>
              <span>Balance: --</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-polka-border bg-polka-darker">
              <div className={`w-10 h-10 rounded-md border ${fromMeta.color} flex items-center justify-center font-mono font-bold`}>
                {fromMeta.icon}
              </div>
              <div className="flex-1">
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="bg-transparent font-display text-white font-semibold text-lg tracking-wide outline-none cursor-pointer"
                >
                  {TOKENS.filter((t) => t.symbol !== toToken).map((t) => (
                    <option key={t.symbol} value={t.symbol} className="bg-polka-dark">{t.symbol}</option>
                  ))}
                </select>
                <p className="font-mono text-[8px] text-polka-text/40 uppercase tracking-wider">{fromMeta.name}</p>
              </div>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                placeholder="0.0"
                className="w-32 text-right bg-transparent text-white text-2xl font-mono outline-none placeholder-polka-text/20"
              />
            </div>
          </div>

          {/* Switch button */}
          <div className="flex justify-center -my-1">
            <button
              onClick={switchTokens}
              className="p-3 rounded-lg border border-polka-border bg-polka-darker hover:border-polka-pink/20 text-polka-text hover:text-polka-pink transition-all hover:rotate-180 duration-300"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>

          {/* To */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[9px] text-polka-text/40 uppercase tracking-wider">
              <span>You receive</span>
              <span>Balance: --</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-polka-border bg-polka-darker">
              <div className={`w-10 h-10 rounded-md border ${toMeta.color} flex items-center justify-center font-mono font-bold`}>
                {toMeta.icon}
              </div>
              <div className="flex-1">
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="bg-transparent font-display text-white font-semibold text-lg tracking-wide outline-none cursor-pointer"
                >
                  {TOKENS.filter((t) => t.symbol !== fromToken).map((t) => (
                    <option key={t.symbol} value={t.symbol} className="bg-polka-dark">{t.symbol}</option>
                  ))}
                </select>
                <p className="font-mono text-[8px] text-polka-text/40 uppercase tracking-wider">{toMeta.name}</p>
              </div>
              <div className="w-32 text-right text-2xl font-mono text-white/60">
                {isQuoting ? (
                  <Loader2 size={18} className="animate-spin ml-auto text-polka-pink" />
                ) : toAmount ? (
                  formatBalance(toAmount, 6)
                ) : (
                  <span className="text-polka-text/20">0.0</span>
                )}
              </div>
            </div>
          </div>

          {/* Swap details */}
          {fromAmount && toAmount && (
            <div className="p-3 rounded-lg border border-polka-border bg-polka-darker space-y-2 font-mono text-[10px] tracking-wider">
              <div className="flex justify-between">
                <span className="text-polka-text/40 flex items-center gap-1"><Info size={10} /> Rate</span>
                <span className="text-white">
                  1 {fromToken} = {formatBalance(String(parseFloat(toAmount) / parseFloat(fromAmount)), 6)} {toToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-polka-text/40">Slippage</span>
                <span className="text-white">0.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-polka-text/40">Min. received</span>
                <span className="text-white">
                  {formatBalance(String(parseFloat(toAmount) * 0.995), 6)} {toToken}
                </span>
              </div>
            </div>
          )}

          {/* Swap button */}
          {isConnected ? (
            <button
              disabled={!fromAmount || !toAmount}
              className="w-full py-4 rounded-lg border border-polka-pink/20 bg-polka-pink/10 text-polka-pink font-mono text-sm font-semibold uppercase tracking-wider
                disabled:opacity-20 disabled:cursor-not-allowed hover:bg-polka-pink/15 transition-all"
            >
              {!fromAmount ? "Enter amount" : !toAmount ? "Fetching quote..." : "Swap"}
            </button>
          ) : (
            <div className="text-center py-4">
              <ConnectButton />
            </div>
          )}
        </div>

        <p className="text-center font-mono text-[8px] text-polka-text/20 mt-6 uppercase tracking-[0.2em]">
          Powered by PolkaAgent DEX on Polkadot Hub
        </p>
      </div>
    </div>
  );
}
