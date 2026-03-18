"use client";

import { useRef, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  Bot,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Shield,
  ExternalLink,
  ChevronRight,
  Zap,
  PieChart,
  Settings,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { BalanceCard } from "@/components/portfolio/BalanceCard";
import { useChat } from "@/hooks/useChat";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMounted } from "@/hooks/useMounted";

export default function Home() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const { messages, isLoading, sendMessage, clearMessages } = useChat(address);
  const { portfolio, isLoading: portfolioLoading, refresh } = usePortfolio(address);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-polka-dark">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-polka-pink to-polka-purple flex items-center justify-center animate-pulse">
          <Bot size={22} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-polka-border glass z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-polka-pink to-polka-purple flex items-center justify-center shadow-lg shadow-polka-pink/20">
              <Bot size={22} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-polka-dark" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Polka<span className="text-polka-pink">Agent</span>
            </h1>
            <p className="text-[10px] text-polka-text leading-none">
              AI DeFi Copilot on Polkadot Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-polka-card border border-polka-border">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[11px] text-polka-text">Polkadot Hub TestNet</span>
          </div>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg hover:bg-polka-card text-polka-text hover:text-white transition-all md:hidden"
          >
            <LayoutDashboard size={18} />
          </button>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <WelcomeScreen isConnected={isConnected} onSend={sendMessage} />
            ) : (
              <>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            disabled={!isConnected}
          />
        </div>

        {/* Sidebar */}
        <aside
          className={`${
            showSidebar ? "w-80" : "w-0"
          } hidden md:block border-l border-polka-border bg-polka-dark/50 transition-all duration-300 overflow-hidden`}
        >
          <div className="p-5 space-y-6 h-full overflow-y-auto w-80">
            <BalanceCard
              portfolio={portfolio}
              isLoading={portfolioLoading}
              onRefresh={refresh}
            />

            {/* Quick Actions */}
            <div>
              <h3 className="text-xs font-semibold text-polka-text uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap size={12} />
                Quick Actions
              </h3>
              <div className="space-y-1.5">
                {[
                  { label: "Check balance", icon: "balance" },
                  { label: "Swap PAS for USDT", icon: "swap" },
                  { label: "View portfolio", icon: "portfolio" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => isConnected && sendMessage(action.label)}
                    disabled={!isConnected}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                      text-sm text-polka-text hover:text-white hover:bg-polka-card
                      border border-transparent hover:border-polka-border
                      disabled:opacity-30 transition-all group"
                  >
                    <span>{action.label}</span>
                    <ChevronRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Network Info */}
            <div className="p-4 rounded-xl bg-polka-card/50 border border-polka-border/50">
              <h4 className="text-xs font-semibold text-polka-text uppercase tracking-wider mb-2">
                Network
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-polka-text">Chain</span>
                  <span className="text-white">Polkadot Hub</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-polka-text">Chain ID</span>
                  <span className="text-white font-mono">420420417</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-polka-text">Currency</span>
                  <span className="text-white">PAS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-polka-text">AI Engine</span>
                  <span className="text-white">DeepSeek</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-xs font-semibold text-polka-text uppercase tracking-wider mb-3">
                Navigate
              </h3>
              <div className="space-y-1.5">
                <Link href="/swap" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-polka-text hover:text-white hover:bg-polka-card border border-transparent hover:border-polka-border transition-all">
                  <ArrowRightLeft size={14} /> Swap
                </Link>
                <Link href="/portfolio" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-polka-text hover:text-white hover:bg-polka-card border border-transparent hover:border-polka-border transition-all">
                  <PieChart size={14} /> Portfolio
                </Link>
                <Link href="/settings" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-polka-text hover:text-white hover:bg-polka-card border border-transparent hover:border-polka-border transition-all">
                  <Settings size={14} /> Agent Settings
                </Link>
                {messages.length > 0 && (
                  <button onClick={clearMessages} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-polka-text hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                    <Trash2 size={14} /> Clear Chat
                  </button>
                )}
              </div>
            </div>

            {/* Footer links */}
            <div className="flex items-center gap-3 text-xs text-polka-text">
              <a
                href="https://faucet.polkadot.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-polka-pink transition-colors"
              >
                Faucet <ExternalLink size={10} />
              </a>
              <span className="text-polka-border">|</span>
              <a
                href="https://docs.polkadot.com/smart-contracts/overview/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-polka-pink transition-colors"
              >
                Docs <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function WelcomeScreen({
  isConnected,
  onSend,
}: {
  isConnected: boolean;
  onSend: (msg: string) => void;
}) {
  const features = [
    {
      icon: <MessageSquare size={20} />,
      title: "Natural Language",
      desc: "Type what you want in plain English",
      gradient: "from-polka-pink to-rose-500",
    },
    {
      icon: <Sparkles size={20} />,
      title: "AI-Powered",
      desc: "DeepSeek AI plans your transactions",
      gradient: "from-polka-purple to-violet-500",
    },
    {
      icon: <Shield size={20} />,
      title: "Secure",
      desc: "You confirm every transaction",
      gradient: "from-emerald-500 to-green-500",
    },
  ];

  const examples = [
    "Check my balance",
    "Swap 10 PAS for USDT",
    "Send 5 USDT to 0x742d35Cc...",
    "Get a quote for 100 PAS to USDC",
    "Add 50 PAS + 50 USDT as liquidity",
    "Show my portfolio",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4">
      {/* Logo & Title */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-polka-pink to-polka-purple flex items-center justify-center shadow-2xl shadow-polka-pink/30 animate-float">
          <Bot size={40} className="text-white" />
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-polka-pink/20 to-polka-purple/20 rounded-3xl blur-xl -z-10" />
      </div>

      <h2 className="text-3xl font-bold text-white mb-2 text-center">
        Welcome to <span className="text-polka-pink">PolkaAgent</span>
      </h2>
      <p className="text-polka-text text-center mb-8 max-w-md">
        Your AI-powered DeFi copilot on Polkadot Hub. Manage your assets with
        natural language — no complex UIs needed.
      </p>

      {/* Feature Cards */}
      <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-lg">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-polka-card border border-polka-border hover:border-polka-pink/30 transition-all"
          >
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-r ${f.gradient} flex items-center justify-center text-white mb-2`}
            >
              {f.icon}
            </div>
            <h3 className="text-xs font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-[10px] text-polka-text leading-tight">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Example prompts */}
      {isConnected && (
        <div className="w-full max-w-lg">
          <p className="text-xs text-polka-text uppercase tracking-wider mb-3 text-center">
            Try saying:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => onSend(ex)}
                className="text-left px-4 py-3 rounded-xl bg-polka-card/50 border border-polka-border/50
                  text-sm text-polka-text hover:text-white hover:border-polka-pink/30
                  hover:bg-polka-card transition-all group"
              >
                <span className="text-polka-pink mr-1.5 opacity-50 group-hover:opacity-100">
                  &rarr;
                </span>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="flex flex-col items-center gap-3">
          <div className="px-6 py-3 rounded-xl bg-polka-card border border-polka-border text-polka-text text-sm">
            Connect your wallet to get started
          </div>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-polka-pink to-polka-purple flex items-center justify-center flex-shrink-0">
        <Bot size={16} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-polka-card border border-polka-border">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-polka-pink typing-dot" />
          <div className="w-2 h-2 rounded-full bg-polka-pink typing-dot" />
          <div className="w-2 h-2 rounded-full bg-polka-pink typing-dot" />
        </div>
      </div>
    </div>
  );
}
