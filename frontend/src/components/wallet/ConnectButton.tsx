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
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-[11px] font-semibold uppercase tracking-wider
          border border-polka-pink/20 bg-polka-pink/10 text-polka-pink
          hover:bg-polka-pink/15 transition-all duration-200"
      >
        <Wallet size={14} />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-polka-border bg-polka-card">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot" />
        <span className="font-mono text-[10px] text-polka-text tracking-wider">
          {formatBalance(balance?.formatted || "0")} PAS
        </span>
      </div>
      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-polka-border bg-polka-card">
        <button onClick={copyAddress} className="flex items-center gap-2 hover:text-polka-pink transition-colors text-polka-text">
          <div className="w-5 h-5 rounded-md border border-polka-pink/15 bg-polka-pink/[0.05]" />
          <span className="font-mono text-[10px] tracking-wider">{shortenAddress(address!)}</span>
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
        <button
          onClick={() => disconnect()}
          className="ml-1.5 p-1 rounded-md hover:bg-red-500/10 text-polka-text hover:text-red-400 transition-all"
          title="Disconnect"
        >
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );
}
