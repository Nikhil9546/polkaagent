"use client";

import { useState, useCallback } from "react";
import { sendChat, type ChatMessage, type ActionData } from "@/lib/api";

export function useChat(walletAddress: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<ActionData[]>([]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!walletAddress || !content.trim()) return;

      const userMsg: ChatMessage = {
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await sendChat(content, walletAddress);

        const actions = response.actions || [];
        const actionDataList: ActionData[] = actions.map((a: Record<string, any>) => ({
          action: a.action,
          params: a.params || {},
          description: a.explanation || a.params?.description,
          requires_confirmation: Boolean(a.params?.requires_confirmation),
          transaction: a.params?.transaction as ActionData["transaction"],
          result: a.params as Record<string, unknown>,
        }));

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: response.message,
          actions: actionDataList,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        const confirmable = actionDataList.filter(
          (a) => a.requires_confirmation || a.transaction
        );
        if (confirmable.length > 0) {
          setPendingActions(confirmable);
        }
      } catch (error) {
        const errorMsg: ChatMessage = {
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [walletAddress]
  );

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingActions([]);
  }, []);

  return {
    messages,
    isLoading,
    pendingActions,
    sendMessage,
    clearPendingActions,
    clearMessages,
  };
}
