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
      <div className="flex items-center justify-center h-screen bg-polka-dark grid-bg">
        <div className="text-center">
          <div className="w-14 h-14 rounded-lg border border-polka-pink/20 bg-polka-card flex items-center justify-center animate-pulse mx-auto mb-4">
            <Bot size={28} className="text-polka-pink" />
          </div>
          <p className="font-mono text-[10px] text-polka-text uppercase tracking-[0.3em]">Initializing...</p>
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
    <div className="min-h-screen bg-polka-dark text-white overflow-hidden scanlines">
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* Nav */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? "glass border-b border-polka-pink/[0.06]" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-polka-pink/20 bg-polka-card flex items-center justify-center">
              <Bot size={16} className="text-polka-pink" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-lg font-bold tracking-wider uppercase">
                Polka<span className="text-polka-pink">Agent</span>
              </span>
              <span className="font-mono text-[9px] text-polka-text/40">v1.0</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="font-mono text-[10px] text-polka-text/40 hover:text-polka-pink uppercase tracking-[0.15em] transition-smooth hidden md:block">Features</a>
            <a href="#how-it-works" className="font-mono text-[10px] text-polka-text/40 hover:text-polka-pink uppercase tracking-[0.15em] transition-smooth hidden md:block">How it Works</a>
            <a href="#architecture" className="font-mono text-[10px] text-polka-text/40 hover:text-polka-pink uppercase tracking-[0.15em] transition-smooth hidden md:block">Architecture</a>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-polka-pink/[0.04] rounded-full blur-[150px]" />
          <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-polka-purple/[0.04] rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-lg border border-polka-pink/10 bg-polka-pink/[0.03] mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot" />
            <span className="font-mono text-[10px] text-polka-pink/70 uppercase tracking-[0.2em]">Autonomous DeFi Agent</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Your Autonomous</span>
            <br />
            <span className="text-polka-pink">AI DeFi Agent.</span>
          </h1>

          <p className="text-base md:text-lg text-polka-text max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            PolkaAgent monitors markets, detects trading signals, and executes trades on Polkadot Hub
            <span className="text-white/70 font-medium"> autonomously</span> &mdash;
            all secured by on-chain smart contract guardrails.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <ConnectButton />
            <a href="#how-it-works" className="flex items-center gap-2 px-6 py-3 rounded-lg border border-polka-border text-[13px] font-mono text-polka-text uppercase tracking-wider hover:text-white hover:border-polka-pink/20 transition-smooth">
              Learn More <ChevronDown size={14} />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "100%", label: "On-Chain" },
              { value: "< 2s", label: "Execution" },
              { value: "24/7", label: "Monitoring" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-lg border border-polka-border bg-polka-card/30">
                <p className="num-display text-3xl md:text-4xl text-polka-pink">{stat.value}</p>
                <p className="font-mono text-[9px] text-polka-text/50 mt-1.5 uppercase tracking-[0.25em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-mono text-[8px] text-polka-text/30 uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-polka-pink/30 to-transparent" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-polka-pink/10 bg-polka-pink/[0.03] mb-5">
              <Zap size={12} className="text-polka-pink" />
              <span className="font-mono text-[10px] text-polka-pink/70 uppercase tracking-[0.2em]">Features</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Not Just Another<br />DeFi Dashboard</h2>
            <p className="text-polka-text mt-3 max-w-md font-light">PolkaAgent doesn&apos;t just show you data. It acts on it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <Zap size={20} />,
                title: "Autonomous Execution",
                desc: "The AI signs and broadcasts transactions through your Agent Wallet. No manual signing, no MetaMask popups.",
                tag: "Core",
              },
              {
                icon: <TrendingUp size={20} />,
                title: "Live Trading Signals",
                desc: "Real-time analysis of DEX pools: arbitrage detection, price movements, pool imbalances.",
                tag: "Analysis",
              },
              {
                icon: <Target size={20} />,
                title: "Continuous Auto-Trading",
                desc: "Toggle on. The agent monitors signals every 60 seconds and executes trades automatically.",
                tag: "Automation",
              },
              {
                icon: <Shield size={20} />,
                title: "On-Chain Guardrails",
                desc: "Smart contract enforced daily spending limits, contract allowlists, and emergency pause.",
                tag: "Security",
              },
              {
                icon: <Layers size={20} />,
                title: "Multi-Step Strategies",
                desc: "\"Diversify my portfolio\" — the AI splits your PAS across USDT and USDC in a single command.",
                tag: "Strategy",
              },
              {
                icon: <Cpu size={20} />,
                title: "DeepSeek AI Engine",
                desc: "Powered by DeepSeek V3 with function calling. The AI reasons about your intent and executes.",
                tag: "Intelligence",
              },
            ].map((f) => (
              <div key={f.title} className="group p-6 rounded-xl tech-card corner-accents card-shine">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-lg border border-polka-pink/15 bg-polka-pink/[0.05] flex items-center justify-center text-polka-pink group-hover:bg-polka-pink/10 transition-smooth">
                    {f.icon}
                  </div>
                  <span className="font-mono text-[8px] text-polka-text/30 uppercase tracking-[0.2em]">{f.tag}</span>
                </div>
                <h3 className="font-display text-[17px] font-semibold text-white mb-2 tracking-wide">{f.title}</h3>
                <p className="text-[13px] text-polka-text/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-polka-pink/10 bg-polka-pink/[0.03] mb-5">
              <Activity size={12} className="text-polka-pink" />
              <span className="font-mono text-[10px] text-polka-pink/70 uppercase tracking-[0.2em]">How it Works</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Three Modes of<br />Operation</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                step: "01",
                title: "One-Click Actions",
                desc: "Pre-built strategies like Quick Swap, Diversify, or Trade Now. Click a button — the AI executes the entire flow autonomously.",
                icon: <Zap size={18} />,
                example: "Click \"Quick Swap\" -> AI swaps 10 PAS for USDT -> Done in 2 seconds",
              },
              {
                step: "02",
                title: "Custom Commands",
                desc: "Type any DeFi action in plain English. The AI parses your intent, validates against your portfolio, and executes.",
                icon: <Bot size={18} />,
                example: "\"Swap 50 PAS for USDT and 50 PAS for USDC\" -> 2 autonomous swaps",
              },
              {
                step: "03",
                title: "Continuous Auto-Trading",
                desc: "Toggle auto-trade ON. The agent monitors DEX pools every 60 seconds, detects arbitrage, and trades within your risk limits.",
                icon: <Activity size={18} />,
                example: "Toggle ON -> AI detects 4% arbitrage -> Swaps 3.8 PAS -> Confirmed on-chain",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 p-6 rounded-xl tech-card group">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg border border-polka-pink/15 bg-polka-pink/[0.05] flex items-center justify-center font-display text-polka-pink font-bold text-lg group-hover:bg-polka-pink/10 group-hover:border-polka-pink/30 transition-smooth">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-polka-text/40">{item.icon}</span>
                    <h3 className="font-display text-[17px] font-semibold text-white tracking-wide">{item.title}</h3>
                  </div>
                  <p className="text-[13px] text-polka-text/60 leading-relaxed mb-3">{item.desc}</p>
                  <div className="px-3 py-2 rounded-lg border border-polka-border bg-polka-darker text-[11px] text-polka-text/50 font-mono">
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
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-polka-pink/10 bg-polka-pink/[0.03] mb-5">
              <Cpu size={12} className="text-polka-pink" />
              <span className="font-mono text-[10px] text-polka-pink/70 uppercase tracking-[0.2em]">Architecture</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Built on Real<br />Infrastructure</h2>
            <p className="text-polka-text mt-3 font-light">Every transaction is real. Every contract is deployed. Nothing is simulated.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: <Globe size={18} />, label: "Polkadot Hub", sub: "Chain ID 420420417" },
              { icon: <Cpu size={18} />, label: "DeepSeek V3", sub: "AI Engine" },
              { icon: <ArrowRightLeft size={18} />, label: "PolkaSwap DEX", sub: "Real AMM" },
              { icon: <Lock size={18} />, label: "AgentWallet", sub: "Smart Contract" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl tech-card text-center">
                <div className="w-10 h-10 rounded-lg border border-polka-border bg-polka-darker flex items-center justify-center text-polka-pink mx-auto mb-3">
                  {item.icon}
                </div>
                <p className="font-display text-[14px] font-semibold text-white tracking-wide">{item.label}</p>
                <p className="font-mono text-[9px] text-polka-text/40 mt-0.5 uppercase tracking-wider">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Flow diagram */}
          <div className="p-6 rounded-xl tech-card">
            <div className="flex items-center justify-between overflow-x-auto gap-2">
              {[
                { label: "Signal Detected", sub: "DEX pool analysis" },
                { label: "AI Analyzes", sub: "DeepSeek V3" },
                { label: "Validates", sub: "Balance + limits" },
                { label: "Executes", sub: "Agent signs tx" },
                { label: "Confirmed", sub: "On Polkadot Hub" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg border border-polka-pink/15 bg-polka-pink/[0.05] flex items-center justify-center text-polka-pink font-display text-lg font-bold mx-auto mb-2">
                      {i + 1}
                    </div>
                    <p className="font-display text-[12px] font-semibold text-white tracking-wide">{step.label}</p>
                    <p className="font-mono text-[8px] text-polka-text/30 uppercase tracking-wider">{step.sub}</p>
                  </div>
                  {i < 4 && <ArrowRight size={14} className="text-polka-pink/20 flex-shrink-0 mt-[-16px]" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Why PolkaAgent?</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-xl tech-card">
              <h3 className="font-display text-[15px] font-semibold text-polka-text/50 mb-4 tracking-wide uppercase">Traditional DeFi</h3>
              <div className="space-y-3">
                {[
                  "Navigate to DEX manually",
                  "Approve token -> wait -> swap -> wait",
                  "Check prices yourself",
                  "Miss opportunities while sleeping",
                  "One action at a time",
                  "No risk management",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-[13px] text-polka-text/40">
                    <span className="text-red-400/50 text-[10px]">&#10005;</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl tech-card border-polka-pink/10">
              <h3 className="font-display text-[15px] font-semibold text-polka-pink mb-4 tracking-wide uppercase">PolkaAgent</h3>
              <div className="space-y-3">
                {[
                  "One-click autonomous execution",
                  "AI handles approvals and routing",
                  "Real-time signal detection",
                  "24/7 continuous auto-trading",
                  "Multi-step strategies in one command",
                  "On-chain spending limits + guardrails",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-[13px] text-white/70">
                    <span className="text-emerald-400 text-[10px]">&#10003;</span> {item}
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
          <div className="w-16 h-16 rounded-lg border border-polka-pink/20 bg-polka-card flex items-center justify-center mx-auto mb-8">
            <Bot size={32} className="text-polka-pink" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">Start Trading<br /><span className="text-polka-pink">Autonomously</span></h2>
          <p className="text-polka-text mb-8 font-light">Connect your wallet to access the dashboard. No signup. No KYC. Just connect and go.</p>
          <ConnectButton />
          <p className="font-mono text-[9px] text-polka-text/20 mt-8 uppercase tracking-[0.15em]">Built for the Polkadot Solidity Hackathon 2026 | Track 1: AI-Powered DeFi</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-polka-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bot size={14} className="text-polka-text/30" />
            <span className="font-mono text-[10px] text-polka-text/30 uppercase tracking-[0.15em]">PolkaAgent</span>
          </div>
          <div className="flex items-center gap-5 font-mono text-[9px] text-polka-text/20 uppercase tracking-wider">
            <a href="https://faucet.polkadot.io/" target="_blank" rel="noopener noreferrer" className="hover:text-polka-pink transition-smooth">Faucet</a>
            <a href="https://docs.polkadot.com/smart-contracts/overview/" target="_blank" rel="noopener noreferrer" className="hover:text-polka-pink transition-smooth">Polkadot Docs</a>
            <a href="https://api-docs.deepseek.com/" target="_blank" rel="noopener noreferrer" className="hover:text-polka-pink transition-smooth">DeepSeek</a>
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
    <div className="min-h-screen bg-polka-dark grid-bg scanlines">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border glass sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg border border-polka-pink/20 bg-polka-card flex items-center justify-center">
              <Bot size={16} className="text-polka-pink" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-polka-dark status-dot" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <h1 className="font-display text-base font-bold tracking-wider uppercase">Polka<span className="text-polka-pink">Agent</span></h1>
            <span className="font-mono text-[8px] text-polka-text/30">v1.0</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-0.5 mr-3">
            {[
              { href: "/signals", icon: <TrendingUp size={12} />, label: "Signals" },
              { href: "/swap", icon: <ArrowRightLeft size={12} />, label: "Swap" },
              { href: "/portfolio", icon: <PieChart size={12} />, label: "Portfolio" },
              { href: "/settings", icon: <Settings size={12} />, label: "Settings" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] text-polka-text/40 hover:text-polka-pink hover:bg-polka-pink/[0.03] uppercase tracking-wider transition-smooth">{item.icon} {item.label}</Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot" />
            <span className="font-mono text-[8px] text-emerald-400 uppercase tracking-wider">TestNet</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        {/* Onboarding Banner */}
        {portfolio && !portfolio.agent_wallet_address && (
          <OnboardingBanner address={address} onComplete={refresh} />
        )}

        {/* Auto-Trade + Portfolio Row */}
        <div className="grid grid-cols-12 gap-4">
          {/* Auto-Trade Toggle */}
          <div className={`col-span-12 md:col-span-7 p-5 rounded-xl transition-smooth ${autoTradeEnabled ? "tech-card border-emerald-500/15" : "tech-card"}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-smooth ${autoTradeEnabled ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-polka-border bg-polka-darker"}`}>
                  {autoTradeEnabled ? <Zap size={18} className="text-emerald-400" /> : <Target size={18} className="text-polka-text/40" />}
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold text-white tracking-wide">Continuous Auto-Trade</h3>
                  <p className="font-mono text-[9px] text-polka-text/40 uppercase tracking-wider">{autoTradeEnabled ? `Active | ${autoTradeStats.total_trades} trades | 60s interval` : "AI monitors signals and trades automatically"}</p>
                </div>
              </div>
              <button onClick={toggleAutoTrade} disabled={autoTradeLoading} className={`relative w-14 h-7 rounded-full transition-smooth ${autoTradeEnabled ? "bg-emerald-500/80" : "bg-polka-border"}`}>
                {autoTradeLoading ? <Loader2 size={14} className="absolute top-1.5 left-1/2 -translate-x-1/2 animate-spin text-white" /> : <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-smooth ${autoTradeEnabled ? "left-8" : "left-1"}`} />}
              </button>
            </div>

            {/* Strategy Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Quick Swap", sub: "10 PAS -> USDT", key: "quick-swap", cmd: "Swap 10 PAS for USDT", icon: <ArrowRightLeft size={12} /> },
                { label: "Diversify", sub: "Split to stables", key: "diversify", cmd: "Swap 5 PAS for USDT and 5 PAS for USDC", icon: <Layers size={12} /> },
                { label: "Trade Now", sub: "On signals", key: "trade-now", cmd: "Auto trade based on signals", icon: <TrendingUp size={12} /> },
              ].map(s => (
                <button key={s.key} onClick={() => executeAction(s.cmd, s.key)} disabled={isExecuting === s.key}
                  className="p-3 rounded-lg border border-polka-border bg-polka-darker hover:border-polka-pink/15 hover:bg-polka-pink/[0.02] disabled:opacity-40 transition-smooth text-left group">
                  <div className="w-7 h-7 rounded-md border border-polka-pink/15 bg-polka-pink/[0.05] flex items-center justify-center text-polka-pink mb-2 group-hover:bg-polka-pink/10 transition-smooth">
                    {isExecuting === s.key ? <Loader2 size={12} className="animate-spin" /> : s.icon}
                  </div>
                  <p className="font-display text-[12px] font-semibold text-white tracking-wide">{s.label}</p>
                  <p className="font-mono text-[9px] text-polka-text/30 uppercase tracking-wider">{s.sub}</p>
                </button>
              ))}
            </div>

            {/* Custom command */}
            <CustomAction onExecute={(msg) => executeAction(msg, "custom")} isLoading={isExecuting === "custom"} />
          </div>

          {/* Portfolio */}
          <div className="col-span-12 md:col-span-5 p-5 rounded-xl tech-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="tech-label text-polka-text/50">Portfolio</h2>
              <button onClick={refresh} disabled={portfolioLoading} className="text-polka-text/30 hover:text-polka-pink transition-smooth">
                <RefreshCw size={12} className={portfolioLoading ? "animate-spin" : ""} />
              </button>
            </div>
            {portfolio ? (
              <div className="space-y-2">
                {Object.entries(portfolio.token_balances).map(([token, data]) => {
                  const bal = typeof data === "string" ? data : data?.wallet || "0";
                  const agentBal = typeof data === "string" ? "0" : data?.agent_wallet || "0";
                  const total = parseFloat(bal) + parseFloat(agentBal);
                  return (
                    <div key={token} className="flex items-center gap-3 p-2.5 rounded-lg border border-polka-border bg-polka-darker hover:border-polka-pink/10 transition-smooth">
                      <div className="w-8 h-8 rounded-md border border-polka-pink/15 bg-polka-pink/[0.05] flex items-center justify-center text-polka-pink font-mono text-[10px] font-bold">{token[0]}</div>
                      <div className="flex-1">
                        <div className="flex justify-between"><span className="font-display text-[13px] font-semibold text-white tracking-wide">{token}</span><span className="font-mono text-[13px] text-white">{formatBalance(String(total))}</span></div>
                        {parseFloat(agentBal) > 0 && <div className="flex justify-between"><span className="font-mono text-[8px] text-polka-text/25 uppercase tracking-wider">Agent</span><span className="font-mono text-[9px] text-polka-text/35">{formatBalance(agentBal)}</span></div>}
                      </div>
                    </div>
                  );
                })}
                {/* Prices */}
                {Object.keys(prices).length > 0 && (
                  <div className="pt-2.5 border-t border-polka-border grid grid-cols-2 gap-2">
                    {Object.entries(prices).map(([token, data]: [string, any]) => (
                      <div key={token} className="p-2.5 rounded-lg border border-polka-border bg-polka-darker text-center">
                        <p className="font-mono text-[7px] text-polka-text/30 uppercase tracking-[0.2em]">PAS/{token}</p>
                        <p className="num-display text-[16px] text-white mt-0.5">{parseFloat(data.price_in_pas).toFixed(4)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <p className="text-polka-text/30 text-sm font-mono">Loading...</p>}
          </div>
        </div>

        {/* Signals + Log */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6 p-5 rounded-xl tech-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="tech-label text-polka-text/50 flex items-center gap-1.5"><Activity size={10} /> Live Signals</h2>
              <Link href="/signals" className="font-mono text-[9px] text-polka-pink/40 hover:text-polka-pink flex items-center gap-1 uppercase tracking-wider transition-smooth">View all <ChevronRight size={10} /></Link>
            </div>
            {signals.length > 0 ? (
              <div className="space-y-2">
                {signals.slice(0, 4).map((s, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-[11px] ${s.signal_type === "BUY" ? "bg-emerald-500/[0.03] border-emerald-500/10" : "bg-amber-500/[0.03] border-amber-500/10"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`font-mono font-bold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider ${s.signal_type === "BUY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-amber-500/10 text-amber-400 border border-amber-500/15"}`}>{s.signal_type}</span>
                      <span className="text-white/70 font-display font-semibold tracking-wide">{s.token}</span>
                      <span className="font-mono text-polka-text/20 text-[8px] ml-auto uppercase">{s.strength}</span>
                    </div>
                    <p className="text-polka-text/40 leading-snug">{s.reason.slice(0, 70)}</p>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><Activity size={20} className="mx-auto text-polka-text/10 mb-2" /><p className="font-mono text-polka-text/20 text-[10px] uppercase tracking-wider">No signals. Market stable.</p></div>}
          </div>

          <div className="col-span-12 md:col-span-6 p-5 rounded-xl tech-card">
            <h2 className="tech-label text-polka-text/50 flex items-center gap-1.5 mb-3"><Clock size={10} /> Execution Log</h2>
            {executions.length > 0 ? (
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto scrollbar-hide">
                {executions.slice(0, 12).map(exec => (
                  <div key={exec.id} className={`p-2.5 rounded-lg border text-[11px] success-pop ${exec.status === "confirmed" ? "bg-emerald-500/[0.02] border-emerald-500/8" : exec.status === "failed" ? "bg-red-500/[0.02] border-red-500/8" : "bg-polka-pink/[0.02] border-polka-pink/8"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {exec.status === "executing" ? <Loader2 size={10} className="text-polka-pink animate-spin" /> : exec.status === "confirmed" ? <Check size={10} className="text-emerald-400" /> : <span className="text-red-400 text-[9px]">!</span>}
                        <span className="text-white/60 font-display font-semibold tracking-wide">{exec.action}</span>
                      </div>
                      <span className="font-mono text-polka-text/15 text-[7px] tracking-wider">{new Date(exec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                    </div>
                    <p className="text-polka-text/30 text-[10px] mt-0.5">{exec.description}</p>
                    {exec.tx_hash && <a href={`https://blockscout-testnet.polkadot.io/tx/0x${exec.tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-polka-pink/30 hover:text-polka-pink text-[8px] font-mono mt-0.5 flex items-center gap-1 transition-smooth">{exec.tx_hash.slice(0, 12)}... <ExternalLink size={7} /></a>}
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><Zap size={20} className="mx-auto text-polka-text/10 mb-2" /><p className="font-mono text-polka-text/20 text-[10px] uppercase tracking-wider">No executions yet</p></div>}
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
      setTimeout(() => { onComplete(); setStep(3); }, 5000);
    } catch (err) {
      console.error("Create wallet failed:", err);
    }
    setIsCreating(false);
  };

  return (
    <div className="p-5 rounded-xl tech-card border-polka-pink/10">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg border border-polka-pink/20 bg-polka-pink/[0.05] flex items-center justify-center text-polka-pink flex-shrink-0">
          <Shield size={18} />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-[16px] font-semibold text-white mb-1 tracking-wide">Set Up Your Agent Wallet</h3>
          <p className="text-[12px] text-polka-text/50 mb-4 leading-relaxed">
            Create a smart contract wallet so the AI agent can execute trades autonomously on your behalf.
            Secured by on-chain spending limits.
          </p>

          {/* Steps */}
          <div className="flex items-center gap-3 mb-4">
            {["Create Wallet", "Deposit PAS", "Start Trading"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[9px] font-bold border ${
                  step > i + 1 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : step === i + 1 ? "bg-polka-pink/10 border-polka-pink/20 text-polka-pink" : "bg-polka-darker border-polka-border text-polka-text/30"
                }`}>
                  {step > i + 1 ? <Check size={10} /> : i + 1}
                </div>
                <span className={`font-mono text-[10px] uppercase tracking-wider ${step === i + 1 ? "text-white" : "text-polka-text/30"}`}>{label}</span>
                {i < 2 && <div className="w-6 h-px bg-polka-border" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <button
              onClick={createWallet}
              disabled={isCreating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-polka-pink/20 bg-polka-pink/10 text-polka-pink font-mono text-[11px] font-semibold uppercase tracking-wider hover:bg-polka-pink/15 disabled:opacity-50 transition-smooth"
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {isCreating ? "Confirm in MetaMask..." : "Create Agent Wallet"}
            </button>
          )}

          {step === 2 && (
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] uppercase tracking-wider">
              <Loader2 size={14} className="animate-spin" /> Setting up wallet...
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] uppercase tracking-wider">
                <Check size={14} /> Wallet created!
              </div>
              <p className="text-[11px] text-polka-text/40">
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
        placeholder="Custom command... e.g. 'Swap 50 PAS for USDC'" className="flex-1 px-3 py-2.5 rounded-lg border border-polka-border bg-polka-darker text-white font-mono text-[11px] placeholder-polka-text/20 focus:outline-none focus:border-polka-pink/15 transition-smooth" />
      <button onClick={() => { if (input.trim() && !isLoading) { onExecute(input.trim()); setInput(""); }}} disabled={!input.trim() || isLoading}
        className="px-5 py-2.5 rounded-lg border border-polka-pink/20 bg-polka-pink/10 text-polka-pink font-mono text-[11px] font-semibold uppercase tracking-wider disabled:opacity-20 hover:bg-polka-pink/15 transition-smooth">
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : "Execute"}
      </button>
    </div>
  );
}
