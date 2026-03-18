"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";
import { shortenAddress, formatBalance } from "@/lib/utils";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
          bg-gradient-to-r from-polka-pink to-polka-purple text-white
          hover:opacity-90 transition-all duration-200 shadow-lg shadow-polka-pink/20"
      >
        <Wallet size={18} />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-polka-card border border-polka-border">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm text-polka-text font-mono">
          {formatBalance(balance?.formatted || "0")} PAS
        </span>
      </div>
      <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-polka-card border border-polka-border">
        <button onClick={copyAddress} className="flex items-center gap-2 hover:text-white transition-colors text-polka-text">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-polka-pink to-polka-purple" />
          <span className="text-sm font-mono">{shortenAddress(address!)}</span>
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
        <button
          onClick={() => disconnect()}
          className="ml-2 p-1 rounded-lg hover:bg-red-500/20 text-polka-text hover:text-red-400 transition-all"
          title="Disconnect"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
