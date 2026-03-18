"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const SUGGESTIONS = [
  "Check my balance",
  "Swap 10 PAS for USDT",
  "Send 5 USDT to 0x...",
  "Show my portfolio",
  "Get a quote for 50 PAS to USDC",
  "Add liquidity with 20 PAS and 20 USDT",
];

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-polka-border bg-polka-dark/80 backdrop-blur-xl">
      {/* Suggestions - only show when no messages */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setInput(s);
              inputRef.current?.focus();
            }}
            className="flex-shrink-0 px-3 py-1.5 text-xs rounded-full
              bg-polka-card border border-polka-border text-polka-text
              hover:border-polka-pink/50 hover:text-white transition-all"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Connect wallet to start..." : "Type your intent... e.g. 'Swap 10 PAS for USDT'"}
            disabled={disabled || isLoading}
            rows={1}
            className="w-full px-4 py-3 rounded-xl bg-polka-card border border-polka-border
              text-white placeholder-polka-text/50 resize-none
              focus:outline-none focus:border-polka-pink/50 focus:ring-1 focus:ring-polka-pink/20
              disabled:opacity-50 transition-all text-sm"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading || disabled}
          className="flex items-center justify-center w-12 h-12 rounded-xl
            bg-gradient-to-r from-polka-pink to-polka-purple text-white
            hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed
            transition-all shadow-lg shadow-polka-pink/20"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
