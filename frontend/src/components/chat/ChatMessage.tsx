"use client";

import { Bot, User } from "lucide-react";
import { ActionPreview } from "./ActionPreview";
import type { ChatMessage as ChatMessageType } from "@/lib/api";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-in`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
        ${
          isUser
            ? "bg-white/[0.06] border border-polka-border/30"
            : "bg-gradient-to-br from-polka-pink to-polka-purple shadow-lg shadow-polka-pink/20"
        }`}
      >
        {isUser ? (
          <User size={14} className="text-polka-text/70" />
        ) : (
          <Bot size={14} className="text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? "text-right" : ""}`}>
        {/* Label */}
        <p className={`text-[10px] text-polka-text/60 mb-1 font-medium tracking-wide ${isUser ? "text-right" : ""}`}>
          {isUser ? "You" : "PolkaAgent"}
        </p>

        <div
          className={`inline-block px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed
          ${
            isUser
              ? "bg-gradient-to-r from-polka-pink/90 to-polka-purple/90 text-white rounded-tr-sm shadow-lg shadow-polka-pink/10"
              : "bg-white/[0.04] border border-polka-border/20 text-gray-200 rounded-tl-sm"
          }`}
        >
          {message.content.split("\n").map((line, i) => (
            <span key={i}>
              {formatLine(line)}
              {i < message.content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>

        {/* Action cards */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.actions.map((action, i) => (
              <ActionPreview key={i} action={action} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[9px] text-polka-text/50 mt-1.5 font-mono ${isUser ? "text-right" : ""}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function formatLine(line: string): React.ReactNode {
  // Bold: **text**
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    // Inline code: `text`
    if (part.includes("`")) {
      const codeParts = part.split(/(`[^`]+`)/g);
      return codeParts.map((cp, j) => {
        if (cp.startsWith("`") && cp.endsWith("`")) {
          return <code key={`${i}-${j}`} className="px-1.5 py-0.5 rounded bg-white/[0.06] text-polka-pink text-[12px] font-mono">{cp.slice(1, -1)}</code>;
        }
        return cp;
      });
    }
    return part;
  });
}
