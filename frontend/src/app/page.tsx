"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract } from "wagmi";
import {
  Bot,
  ArrowRightLeft,
  TrendingUp,
  Shield,
  ExternalLink,
  PieChart,
  Settings,
  Target,
  Zap,
  Loader2,
  Check,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  ChevronRight,
  ArrowRight,
  Lock,
  Cpu,
  BarChart3,
  Wallet,
  Globe,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMounted } from "@/hooks/useMounted";
import { formatBalance } from "@/lib/utils";

// ─── Types ───
interface ExecutionResult {
  id: number;
  action: string;
  description: string;
  status: "executing" | "confirmed" | "failed";
  tx_hash?: string;
  timestamp: number;
}
interface Signal {
  signal_type: string;
  token: string;
  strength: string;
  reason: string;
  recommended_action: string;
  change_pct: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function Home() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen gradient-bg">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-polka-pink to-polka-purple flex items-center justify-center animate-pulse shadow-2xl shadow-polka-pink/30">
          <Bot size={28} className="text-white" />
        </div>
      </div>
    );
  }

  if (!isConnected) return <LandingPage />;
  return <Dashboard address={address!} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LANDING PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#06060e] text-white overflow-hidden">
      {/* Nav */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? "glass border-b border-white/[0.04]" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-polka-pink to-polka-purple flex items-center justify-center shadow-lg shadow-polka-pink/25">
              <Bot size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Polka<span className="text-transparent bg-clip-text bg-gradient-to-r from-polka-pink to-polka-purple">Agent</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-[13px] text-white/40 hover:text-white transition-smooth hidden md:block">Features</a>
            <a href="#how-it-works" className="text-[13px] text-white/40 hover:text-white transition-smooth hidden md:block">How it Works</a>
            <a href="#architecture" className="text-[13px] text-white/40 hover:text-white transition-smooth hidden md:block">Architecture</a>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-polka-pink/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-polka-purple/8 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot" />
            <span className="text-[11px] text-white/50 tracking-wide">Live on Polkadot Hub TestNet</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-white">Your Autonomous</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-polka-pink via-purple-400 to-polka-purple">AI DeFi Agent</span>
          </h1>

          <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
            PolkaAgent monitors markets, detects trading signals, and executes trades on Polkadot Hub
            <span className="text-white/60 font-medium"> autonomously</span> &mdash;
            all secured by on-chain smart contract guardrails.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <ConnectButton />
            <a href="#how-it-works" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] text-[14px] text-white/60 hover:text-white hover:border-white/20 transition-smooth">
              See how it works <ChevronDown size={14} />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "100%", label: "On-Chain" },
              { value: "< 2s", label: "Execution" },
              { value: "24/7", label: "Monitoring" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-polka-pink to-polka-purple">{stat.value}</p>
                <p className="text-[11px] text-white/30 mt-1 tracking-wider uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-5 h-8 rounded-full border border-white/10 flex justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/30 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] text-polka-pink font-medium tracking-[0.25em] uppercase mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Not just another DeFi dashboard</h2>
            <p className="text-white/30 mt-3 max-w-md mx-auto">PolkaAgent doesn&apos;t just show you data. It acts on it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Zap size={22} />,
                title: "Autonomous Execution",
                desc: "The AI signs and broadcasts transactions through your Agent Wallet. No manual signing, no MetaMask popups. Just results.",
                gradient: "from-polka-pink to-rose-500",
                tag: "Core",
              },
              {
                icon: <TrendingUp size={22} />,
                title: "Live Trading Signals",
                desc: "Real-time analysis of DEX pools: arbitrage detection, price movements, pool imbalances. Signals you can act on instantly.",
                gradient: "from-amber-500 to-orange-500",
                tag: "Analysis",
              },
              {
                icon: <Target size={22} />,
                title: "Continuous Auto-Trading",
                desc: "Flip a switch. The agent monitors signals every 60 seconds and executes trades automatically when opportunities appear.",
                gradient: "from-emerald-500 to-cyan-500",
                tag: "Automation",
              },
              {
                icon: <Shield size={22} />,
                title: "On-Chain Guardrails",
                desc: "Smart contract enforced daily spending limits, contract allowlists, and emergency pause. You stay in control even when the AI trades.",
                gradient: "from-blue-500 to-indigo-500",
                tag: "Security",
              },
              {
                icon: <Layers size={22} />,
                title: "Multi-Step Strategies",
                desc: "\"Diversify my portfolio\" — the AI splits your PAS across USDT and USDC in a single command, executing multiple swaps.",
                gradient: "from-violet-500 to-purple-500",
                tag: "Strategy",
              },
              {
                icon: <Cpu size={22} />,
                title: "DeepSeek AI Engine",
                desc: "Powered by DeepSeek V3 with function calling. The AI reasons about your intent, validates against chain state, and executes.",
                gradient: "from-polka-purple to-pink-500",
                tag: "Intelligence",
              },
            ].map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-smooth card-shine">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-smooth`}>
                    {f.icon}
                  </div>
                  <span className="text-[9px] text-white/20 uppercase tracking-wider font-medium">{f.tag}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-white/30 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-28 px-6 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] text-polka-pink font-medium tracking-[0.25em] uppercase mb-3">How it Works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three modes of operation</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "One-Click Actions",
                desc: "Pre-built strategies like Quick Swap, Diversify, or Trade Now. Click a button — the AI executes the entire flow autonomously and shows you the transaction hash.",
                icon: <Zap size={20} />,
                example: "Click \"Quick Swap\" → AI swaps 10 PAS for USDT → Done in 2 seconds",
              },
              {
                step: "02",
                title: "Custom Commands",
                desc: "Type any DeFi action in plain English. The AI parses your intent, validates against your portfolio, and executes. Multiple actions from a single command.",
                icon: <Bot size={20} />,
                example: "\"Swap 50 PAS for USDT and 50 PAS for USDC\" → 2 autonomous swaps",
              },
              {
                step: "03",
                title: "Continuous Auto-Trading",
                desc: "Toggle auto-trade ON. The agent monitors DEX pools every 60 seconds, detects arbitrage and price opportunities, and trades automatically within your risk limits.",
                icon: <Activity size={20} />,
                example: "Toggle ON → AI detects 4% arbitrage → Swaps 3.8 PAS → Confirmed on-chain",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-smooth group">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-polka-pink/20 to-polka-purple/20 flex items-center justify-center text-polka-pink font-bold text-lg group-hover:from-polka-pink group-hover:to-polka-purple group-hover:text-white transition-smooth">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white/40">{item.icon}</span>
                    <h3 className="text-[16px] font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-[13px] text-white/30 leading-relaxed mb-3">{item.desc}</p>
                  <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-white/40 font-mono">
                    {item.example}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] text-polka-pink font-medium tracking-[0.25em] uppercase mb-3">Architecture</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built on real infrastructure</h2>
            <p className="text-white/30 mt-3">Every transaction is real. Every contract is deployed. Nothing is simulated.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: <Globe size={18} />, label: "Polkadot Hub", sub: "Chain ID 420420417" },
              { icon: <Cpu size={18} />, label: "DeepSeek V3", sub: "AI Engine" },
              { icon: <ArrowRightLeft size={18} />, label: "PolkaSwap DEX", sub: "Real AMM" },
              { icon: <Lock size={18} />, label: "AgentWallet", sub: "Smart Contract" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 mx-auto mb-2">
                  {item.icon}
                </div>
                <p className="text-[13px] font-medium text-white">{item.label}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Flow diagram */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between overflow-x-auto gap-2">
              {[
                { label: "Signal Detected", sub: "DEX pool analysis", color: "from-amber-500 to-orange-500" },
                { label: "AI Analyzes", sub: "DeepSeek V3", color: "from-polka-purple to-violet-500" },
                { label: "Validates", sub: "Balance + limits", color: "from-blue-500 to-cyan-500" },
                { label: "Executes", sub: "Agent signs tx", color: "from-polka-pink to-rose-500" },
                { label: "Confirmed", sub: "On Polkadot Hub", color: "from-emerald-500 to-green-500" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-center">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-lg font-bold mx-auto mb-1.5 shadow-lg`}>
                      {i + 1}
                    </div>
                    <p className="text-[11px] font-medium text-white">{step.label}</p>
                    <p className="text-[9px] text-white/25">{step.sub}</p>
                  </div>
                  {i < 4 && <ArrowRight size={16} className="text-white/10 flex-shrink-0 mt-[-16px]" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-28 px-6 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Why PolkaAgent?</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <h3 className="text-[14px] font-semibold text-white/40 mb-4">Traditional DeFi</h3>
              <div className="space-y-3">
                {[
                  "Navigate to DEX manually",
                  "Approve token → wait → swap → wait",
                  "Check prices yourself",
                  "Miss opportunities while sleeping",
                  "One action at a time",
                  "No risk management",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[13px] text-white/25">
                    <span className="text-red-400/40">✕</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-polka-pink/[0.04] to-polka-purple/[0.04] border border-polka-pink/10">
              <h3 className="text-[14px] font-semibold text-polka-pink mb-4">PolkaAgent</h3>
              <div className="space-y-3">
                {[
                  "One-click autonomous execution",
                  "AI handles approvals and routing",
                  "Real-time signal detection",
                  "24/7 continuous auto-trading",
                  "Multi-step strategies in one command",
                  "On-chain spending limits + guardrails",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[13px] text-white/60">
                    <span className="text-emerald-400">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-polka-pink to-polka-purple flex items-center justify-center shadow-2xl shadow-polka-pink/30 mx-auto mb-8">
            <Bot size={32} className="text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Start trading autonomously</h2>
          <p className="text-white/30 mb-8">Connect your wallet to access the dashboard. No signup. No KYC. Just connect and go.</p>
          <ConnectButton />
          <p className="text-[10px] text-white/15 mt-6">Built for the Polkadot Solidity Hackathon 2026 | Track 1: AI-Powered DeFi</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-white/20" />
            <span className="text-[12px] text-white/20">PolkaAgent</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white/15">
            <a href="https://faucet.polkadot.io/" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-smooth">Faucet</a>
            <a href="https://docs.polkadot.com/smart-contracts/overview/" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-smooth">Polkadot Docs</a>
            <a href="https://api-docs.deepseek.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-smooth">DeepSeek</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DASHBOARD (shown when wallet connected)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Dashboard({ address }: { address: string }) {
  const { portfolio, isLoading: portfolioLoading, refresh } = usePortfolio(address);
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [autoTradeLoading, setAutoTradeLoading] = useState(false);
  const [autoTradeStats, setAutoTradeStats] = useState({ total_trades: 0, last_run: 0 });

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch(`${API}/signals`);
      if (res.ok) { const data = await res.json(); setSignals(data.signals || []); setPrices(data.prices || {}); }
    } catch {}
  }, []);

  const fetchAutoTradeStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/autotrade/status?wallet_address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setAutoTradeEnabled(data.enabled);
        setAutoTradeStats({ total_trades: data.total_trades, last_run: data.last_run });
        if (data.recent_trades?.length) {
          const newExecs: ExecutionResult[] = data.recent_trades.filter((t: any) => t.result?.tx_hash).map((t: any) => ({
            id: t.timestamp, action: `Auto: ${t.trade?.from}-${t.trade?.to}`,
            description: t.result?.description || `${t.trade?.amount} ${t.trade?.from} -> ${t.trade?.to}`,
            status: t.result?.success ? "confirmed" as const : "failed" as const,
            tx_hash: t.result?.tx_hash, timestamp: t.timestamp * 1000,
          }));
          setExecutions(prev => { const ids = new Set(prev.map(e => e.tx_hash)); return [...newExecs.filter((e: ExecutionResult) => !ids.has(e.tx_hash)), ...prev].slice(0, 20); });
        }
      }
    } catch {}
  }, [address]);

  const toggleAutoTrade = async () => {
    setAutoTradeLoading(true);
    try {
      const endpoint = autoTradeEnabled ? "autotrade/stop" : "autotrade/start";
      const res = await fetch(`${API}/${endpoint}?wallet_address=${address}&interval=60&max_trade_pct=10&min_strength=MODERATE`, { method: "POST" });
      if (res.ok) {
        setAutoTradeEnabled(!autoTradeEnabled);
        if (!autoTradeEnabled) setExecutions(prev => [{ id: Date.now(), action: "Auto-Trade", description: "Continuous auto-trading enabled (60s interval)", status: "confirmed", timestamp: Date.now() }, ...prev]);
      }
    } catch {}
    setAutoTradeLoading(false);
  };

  useEffect(() => {
    fetchSignals(); fetchAutoTradeStatus();
    const i1 = setInterval(fetchSignals, 30000);
    const i2 = setInterval(fetchAutoTradeStatus, 15000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, [fetchSignals, fetchAutoTradeStatus]);

  const executeAction = async (message: string, label: string) => {
    if (isExecuting) return;
    setIsExecuting(label);
    const id = Date.now();
    setExecutions(prev => [{ id, action: label, description: "Executing...", status: "executing", timestamp: id }, ...prev]);
    try {
      const res = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, wallet_address: address }) });
      const data = await res.json();
      const results: ExecutionResult[] = (data.actions || []).map((a: any) => {
        const p = a.params || {};
        return { id: Date.now() + Math.random(), action: a.action, description: p.description || data.message?.slice(0, 80) || a.action, status: p.tx_hash ? (p.success ? "confirmed" : "failed") : p.error ? "failed" : "confirmed", tx_hash: p.tx_hash, timestamp: Date.now() };
      });
      if (results.length === 0) results.push({ id, action: label, description: data.message?.slice(0, 100) || "Done", status: "confirmed", timestamp: Date.now() });
      setExecutions(prev => [...results, ...prev.filter(e => e.id !== id)]);
      refresh(); fetchSignals();
    } catch { setExecutions(prev => prev.map(e => e.id === id ? { ...e, status: "failed", description: "Failed" } : e)); }
    setIsExecuting(null);
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border/30 glass sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-polka-pink to-polka-purple flex items-center justify-center shadow-lg shadow-polka-pink/25">
              <Bot size={18} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0a12] status-dot" />
          </div>
          <h1 className="text-base font-bold tracking-tight">Polka<span className="text-transparent bg-clip-text bg-gradient-to-r from-polka-pink to-polka-purple">Agent</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-1 mr-2">
            {[
              { href: "/signals", icon: <TrendingUp size={13} />, label: "Signals" },
              { href: "/swap", icon: <ArrowRightLeft size={13} />, label: "Swap" },
              { href: "/portfolio", icon: <PieChart size={13} />, label: "Portfolio" },
              { href: "/settings", icon: <Settings size={13} />, label: "Settings" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-polka-text/50 hover:text-white hover:bg-white/[0.04] transition-smooth">{item.icon} {item.label}</Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot" />
            <span className="text-[9px] text-emerald-400 font-medium">TestNet</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Onboarding Banner */}
        {portfolio && !portfolio.agent_wallet_address && (
          <OnboardingBanner address={address} onComplete={refresh} />
        )}

        {/* Auto-Trade + Portfolio Row */}
        <div className="grid grid-cols-12 gap-4">
          {/* Auto-Trade Toggle */}
          <div className={`col-span-12 md:col-span-7 p-5 rounded-2xl border transition-smooth ${autoTradeEnabled ? "bg-emerald-500/[0.04] border-emerald-500/15" : "bg-white/[0.02] border-polka-border/20"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${autoTradeEnabled ? "bg-gradient-to-br from-emerald-500 to-cyan-500" : "bg-white/[0.06]"}`}>
                  {autoTradeEnabled ? <Zap size={18} className="text-white" /> : <Target size={18} className="text-polka-text/40" />}
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-white">Continuous Auto-Trade</h3>
                  <p className="text-[11px] text-polka-text/40">{autoTradeEnabled ? `Active | ${autoTradeStats.total_trades} trades | Checking every 60s` : "AI monitors signals and trades automatically"}</p>
                </div>
              </div>
              <button onClick={toggleAutoTrade} disabled={autoTradeLoading} className={`relative w-14 h-7 rounded-full transition-smooth ${autoTradeEnabled ? "bg-emerald-500" : "bg-white/[0.08]"}`}>
                {autoTradeLoading ? <Loader2 size={14} className="absolute top-1.5 left-1/2 -translate-x-1/2 animate-spin text-white" /> : <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-smooth ${autoTradeEnabled ? "left-8" : "left-1"}`} />}
              </button>
            </div>

            {/* Strategy Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Quick Swap", sub: "10 PAS → USDT", key: "quick-swap", cmd: "Swap 10 PAS for USDT", gradient: "from-polka-pink to-polka-purple" },
                { label: "Diversify", sub: "Split to stables", key: "diversify", cmd: "Swap 5 PAS for USDT and 5 PAS for USDC", gradient: "from-violet-500 to-purple-500" },
                { label: "Trade Now", sub: "On signals", key: "trade-now", cmd: "Auto trade based on signals", gradient: "from-amber-500 to-orange-500" },
              ].map(s => (
                <button key={s.key} onClick={() => executeAction(s.cmd, s.key)} disabled={isExecuting === s.key}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08] disabled:opacity-40 transition-smooth text-left group">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-smooth`}>
                    {isExecuting === s.key ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                  </div>
                  <p className="text-[12px] font-medium text-white">{s.label}</p>
                  <p className="text-[10px] text-white/25">{s.sub}</p>
                </button>
              ))}
            </div>

            {/* Custom command */}
            <CustomAction onExecute={(msg) => executeAction(msg, "custom")} isLoading={isExecuting === "custom"} />
          </div>

          {/* Portfolio */}
          <div className="col-span-12 md:col-span-5 p-5 rounded-2xl bg-white/[0.02] border border-polka-border/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-semibold text-polka-text/40 uppercase tracking-[0.15em]">Portfolio</h2>
              <button onClick={refresh} disabled={portfolioLoading} className="text-polka-text/30 hover:text-white transition-smooth">
                <RefreshCw size={12} className={portfolioLoading ? "animate-spin" : ""} />
              </button>
            </div>
            {portfolio ? (
              <div className="space-y-2.5">
                {Object.entries(portfolio.token_balances).map(([token, data]) => {
                  const bal = typeof data === "string" ? data : data?.wallet || "0";
                  const agentBal = typeof data === "string" ? "0" : data?.agent_wallet || "0";
                  const total = parseFloat(bal) + parseFloat(agentBal);
                  const colors: Record<string, string> = { PAS: "from-polka-pink to-polka-purple", USDT: "from-green-500 to-emerald-500", USDC: "from-blue-500 to-cyan-500" };
                  return (
                    <div key={token} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-smooth">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[token] || "from-gray-500 to-gray-600"} flex items-center justify-center text-white text-[10px] font-bold`}>{token[0]}</div>
                      <div className="flex-1">
                        <div className="flex justify-between"><span className="text-[13px] font-medium text-white">{token}</span><span className="text-[13px] font-mono text-white">{formatBalance(String(total))}</span></div>
                        {parseFloat(agentBal) > 0 && <div className="flex justify-between"><span className="text-[9px] text-polka-text/25">Agent</span><span className="text-[9px] text-polka-text/35 font-mono">{formatBalance(agentBal)}</span></div>}
                      </div>
                    </div>
                  );
                })}
                {/* Prices */}
                {Object.keys(prices).length > 0 && (
                  <div className="pt-2 border-t border-white/[0.04] grid grid-cols-2 gap-2">
                    {Object.entries(prices).map(([token, data]: [string, any]) => (
                      <div key={token} className="p-2 rounded-lg bg-white/[0.02] text-center">
                        <p className="text-[8px] text-white/20 uppercase tracking-wider">PAS/{token}</p>
                        <p className="text-[14px] font-mono font-semibold text-white">{parseFloat(data.price_in_pas).toFixed(4)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <p className="text-polka-text/30 text-sm">Loading...</p>}
          </div>
        </div>

        {/* Signals + Log */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6 p-5 rounded-2xl bg-white/[0.02] border border-polka-border/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-semibold text-polka-text/40 uppercase tracking-[0.15em] flex items-center gap-1.5"><Activity size={10} /> Signals</h2>
              <Link href="/signals" className="text-[10px] text-polka-pink/50 hover:text-polka-pink flex items-center gap-1 transition-smooth">All <ChevronRight size={10} /></Link>
            </div>
            {signals.length > 0 ? (
              <div className="space-y-2">
                {signals.slice(0, 4).map((s, i) => (
                  <div key={i} className={`p-3 rounded-xl text-[11px] ${s.signal_type === "BUY" ? "bg-emerald-500/[0.04] border border-emerald-500/8" : "bg-amber-500/[0.04] border border-amber-500/8"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded ${s.signal_type === "BUY" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>{s.signal_type}</span>
                      <span className="text-white/70 font-medium">{s.token}</span>
                      <span className="text-white/15 text-[9px] ml-auto">{s.strength}</span>
                    </div>
                    <p className="text-white/30 leading-snug">{s.reason.slice(0, 70)}</p>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-6"><Activity size={20} className="mx-auto text-white/5 mb-2" /><p className="text-white/20 text-[11px]">No signals. Market stable.</p></div>}
          </div>

          <div className="col-span-12 md:col-span-6 p-5 rounded-2xl bg-white/[0.02] border border-polka-border/20">
            <h2 className="text-[10px] font-semibold text-polka-text/40 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-3"><Clock size={10} /> Execution Log</h2>
            {executions.length > 0 ? (
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {executions.slice(0, 12).map(exec => (
                  <div key={exec.id} className={`p-2.5 rounded-xl text-[11px] success-pop ${exec.status === "confirmed" ? "bg-emerald-500/[0.03] border border-emerald-500/8" : exec.status === "failed" ? "bg-red-500/[0.03] border border-red-500/8" : "bg-polka-pink/[0.03] border border-polka-pink/8"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {exec.status === "executing" ? <Loader2 size={10} className="text-polka-pink animate-spin" /> : exec.status === "confirmed" ? <Check size={10} className="text-emerald-400" /> : <span className="text-red-400 text-[9px]">!</span>}
                        <span className="text-white/60 font-medium">{exec.action}</span>
                      </div>
                      <span className="text-white/10 text-[8px] font-mono">{new Date(exec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                    </div>
                    <p className="text-white/25 text-[10px] mt-0.5">{exec.description}</p>
                    {exec.tx_hash && <a href={`https://blockscout-testnet.polkadot.io/tx/0x${exec.tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-polka-pink/40 hover:text-polka-pink text-[8px] font-mono mt-0.5 flex items-center gap-1 transition-smooth">{exec.tx_hash.slice(0, 12)}... <ExternalLink size={7} /></a>}
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-6"><Zap size={20} className="mx-auto text-white/5 mb-2" /><p className="text-white/20 text-[11px]">No executions yet</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingBanner({ address, onComplete }: { address: string; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const AGENT_ADDRESS = "0xe56b5B95385E900ae024dcdCbb547B3c5b4b985d";
  const FACTORY = process.env.NEXT_PUBLIC_WALLET_FACTORY || "";

  const createWallet = async () => {
    if (!FACTORY) return;
    setIsCreating(true);
    try {
      await writeContractAsync({
        address: FACTORY as `0x${string}`,
        abi: [{ inputs: [{ name: "agent", type: "address" }], name: "createWallet", outputs: [{ name: "", type: "address" }], stateMutability: "nonpayable", type: "function" }],
        functionName: "createWallet",
        args: [AGENT_ADDRESS as `0x${string}`],
      });
      setStep(2);
      // Wait for tx to be indexed
      setTimeout(() => { onComplete(); setStep(3); }, 5000);
    } catch (err) {
      console.error("Create wallet failed:", err);
    }
    setIsCreating(false);
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-polka-pink/[0.06] to-polka-purple/[0.06] border border-polka-pink/15">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-polka-pink to-polka-purple flex items-center justify-center text-white flex-shrink-0">
          <Shield size={18} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-white mb-1">Set up your Agent Wallet</h3>
          <p className="text-[12px] text-white/40 mb-4 leading-relaxed">
            Create a smart contract wallet so the AI agent can execute trades autonomously on your behalf.
            Secured by on-chain spending limits — you stay in control.
          </p>

          {/* Steps */}
          <div className="flex items-center gap-3 mb-4">
            {["Create Wallet", "Deposit PAS", "Start Trading"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-polka-pink text-white" : "bg-white/[0.06] text-white/30"
                }`}>
                  {step > i + 1 ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-[11px] ${step === i + 1 ? "text-white" : "text-white/30"}`}>{label}</span>
                {i < 2 && <div className="w-6 h-px bg-white/10" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <button
              onClick={createWallet}
              disabled={isCreating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-polka-pink to-polka-purple text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-smooth shadow-lg shadow-polka-pink/20"
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {isCreating ? "Confirm in MetaMask..." : "Create Agent Wallet"}
            </button>
          )}

          {step === 2 && (
            <div className="flex items-center gap-2 text-emerald-400 text-[13px]">
              <Loader2 size={14} className="animate-spin" /> Setting up wallet...
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-[13px]">
                <Check size={14} /> Wallet created! Now deposit PAS to start trading.
              </div>
              <p className="text-[11px] text-white/30">
                Send PAS to your Agent Wallet from the <Link href="/settings" className="text-polka-pink hover:underline">Settings</Link> page, or ask the AI: &quot;deposit 10 PAS&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomAction({ onExecute, isLoading }: { onExecute: (msg: string) => void; isLoading: boolean }) {
  const [input, setInput] = useState("");
  return (
    <div className="flex gap-2 mt-3">
      <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && input.trim() && !isLoading) { onExecute(input.trim()); setInput(""); }}}
        placeholder="Custom: 'Swap 50 PAS for USDC'" className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-white text-[12px] placeholder-white/15 focus:outline-none focus:border-polka-pink/20 transition-smooth" />
      <button onClick={() => { if (input.trim() && !isLoading) { onExecute(input.trim()); setInput(""); }}} disabled={!input.trim() || isLoading}
        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-polka-pink to-polka-purple text-white text-[12px] font-medium disabled:opacity-20 hover:opacity-90 transition-smooth shadow-lg shadow-polka-pink/10">
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : "Run"}
      </button>
    </div>
  );
}
