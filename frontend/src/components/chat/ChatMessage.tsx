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
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${
          isUser
            ? "bg-polka-card border border-polka-border"
            : "bg-gradient-to-r from-polka-pink to-polka-purple"
        }`}
      >
        {isUser ? (
          <User size={16} className="text-polka-text" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${
            isUser
              ? "bg-gradient-to-r from-polka-pink to-polka-purple text-white rounded-tr-md"
              : "bg-polka-card border border-polka-border text-gray-200 rounded-tl-md"
          }`}
        >
          {message.content.split("\n").map((line, i) => (
            <span key={i}>
              {line}
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
        <div
          className={`text-[10px] text-polka-text/50 mt-1 ${
            isUser ? "text-right" : ""
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
