"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

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
    <div className="p-4 border-t border-polka-border/30 glass">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Connect wallet to start..."
                : "Tell me what to do... e.g. 'Swap 10 PAS for USDT'"
            }
            disabled={disabled || isLoading}
            rows={1}
            className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white/[0.04] border border-polka-border/20
              text-white placeholder-polka-text/60 resize-none
              focus:outline-none focus:border-polka-pink/30
              disabled:opacity-30 transition-smooth text-[14px] leading-relaxed"
            style={{ minHeight: "52px", maxHeight: "120px" }}
          />
          {!disabled && !isLoading && (
            <div className="absolute right-3 bottom-3">
              <Sparkles size={14} className="text-polka-text/50" />
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading || disabled}
          className="flex items-center justify-center w-[52px] h-[52px] rounded-2xl
            bg-gradient-to-br from-polka-pink to-polka-purple text-white
            hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed
            transition-smooth shadow-lg shadow-polka-pink/20"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
