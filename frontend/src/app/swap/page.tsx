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
  { symbol: "PAS", name: "Polkadot Hub", color: "from-polka-pink to-polka-purple", icon: "P" },
  { symbol: "USDT", name: "Tether USD", color: "from-green-500 to-emerald-500", icon: "$" },
  { symbol: "USDC", name: "USD Coin", color: "from-blue-500 to-cyan-500", icon: "$" },
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
      // Quote failed silently
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
    <div className="min-h-screen bg-polka-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border glass sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-polka-card text-polka-text hover:text-white transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Swap</h1>
            <p className="text-[10px] text-polka-text">Trade tokens on Polkadot Hub</p>
          </div>
        </div>
        <ConnectButton />
      </header>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl bg-polka-card border border-polka-border p-6 space-y-4 glow-pink">
          {/* From */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-polka-text">
              <span>You pay</span>
              <span>Balance: --</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-polka-dark border border-polka-border">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${fromMeta.color} flex items-center justify-center text-white font-bold`}>
                {fromMeta.icon}
              </div>
              <div className="flex-1">
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="bg-transparent text-white font-semibold text-lg outline-none cursor-pointer"
                >
                  {TOKENS.filter((t) => t.symbol !== toToken).map((t) => (
                    <option key={t.symbol} value={t.symbol} className="bg-polka-dark">{t.symbol}</option>
                  ))}
                </select>
                <p className="text-xs text-polka-text">{fromMeta.name}</p>
              </div>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                placeholder="0.0"
                className="w-32 text-right bg-transparent text-white text-2xl font-mono outline-none placeholder-polka-text/30"
              />
            </div>
          </div>

          {/* Switch button */}
          <div className="flex justify-center -my-1">
            <button
              onClick={switchTokens}
              className="p-3 rounded-xl bg-polka-dark border border-polka-border hover:border-polka-pink/50 text-polka-text hover:text-polka-pink transition-all hover:rotate-180 duration-300"
            >
              <ArrowDownUp size={18} />
            </button>
          </div>

          {/* To */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-polka-text">
              <span>You receive</span>
              <span>Balance: --</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-polka-dark border border-polka-border">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${toMeta.color} flex items-center justify-center text-white font-bold`}>
                {toMeta.icon}
              </div>
              <div className="flex-1">
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="bg-transparent text-white font-semibold text-lg outline-none cursor-pointer"
                >
                  {TOKENS.filter((t) => t.symbol !== fromToken).map((t) => (
                    <option key={t.symbol} value={t.symbol} className="bg-polka-dark">{t.symbol}</option>
                  ))}
                </select>
                <p className="text-xs text-polka-text">{toMeta.name}</p>
              </div>
              <div className="w-32 text-right text-2xl font-mono text-white/60">
                {isQuoting ? (
                  <Loader2 size={20} className="animate-spin ml-auto" />
                ) : toAmount ? (
                  formatBalance(toAmount, 6)
                ) : (
                  <span className="text-polka-text/30">0.0</span>
                )}
              </div>
            </div>
          </div>

          {/* Swap details */}
          {fromAmount && toAmount && (
            <div className="p-3 rounded-xl bg-polka-dark/50 border border-polka-border/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-polka-text flex items-center gap-1"><Info size={12} /> Rate</span>
                <span className="text-white">
                  1 {fromToken} = {formatBalance(String(parseFloat(toAmount) / parseFloat(fromAmount)), 6)} {toToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-polka-text">Slippage tolerance</span>
                <span className="text-white">0.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-polka-text">Min. received</span>
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-polka-pink to-polka-purple text-white font-bold text-lg
                disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all
                shadow-lg shadow-polka-pink/20"
            >
              {!fromAmount ? "Enter amount" : !toAmount ? "Fetching quote..." : "Swap"}
            </button>
          ) : (
            <div className="text-center py-4">
              <ConnectButton />
            </div>
          )}
        </div>

        {/* Powered by */}
        <p className="text-center text-[10px] text-polka-text/50 mt-6">
          Powered by PolkaAgent DEX on Polkadot Hub
        </p>
      </div>
    </div>
  );
}
