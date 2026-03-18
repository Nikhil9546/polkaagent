"use client";

import { useState, useEffect, useCallback } from "react";
import { getPortfolio, getWalletInfo, type PortfolioData } from "@/lib/api";

export function usePortfolio(walletAddress: string | undefined) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [agentWallet, setAgentWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const [portfolioData, walletInfo] = await Promise.all([
        getPortfolio(walletAddress),
        getWalletInfo(walletAddress),
      ]);
      setPortfolio(portfolioData);
      setAgentWallet(walletInfo.agent_wallet);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { portfolio, agentWallet, isLoading, refresh };
}
