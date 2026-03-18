const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actions?: ActionData[];
  timestamp: number;
}

export interface ActionData {
  action: string;
  params: Record<string, string>;
  result?: Record<string, unknown>;
  description?: string;
  requires_confirmation?: boolean;
  transaction?: {
    to: string;
    data: string;
    value: string;
    gas_estimate: string;
  };
}

export interface PortfolioData {
  native_balance: string;
  token_balances: Record<string, { wallet: string; agent_wallet: string }>;
  lp_positions: Array<Record<string, string>>;
  total_value_usd: string;
  agent_wallet_address: string | null;
}

export interface QuoteData {
  amount_in: string;
  amount_out: string;
  price_impact: string;
  route: string[];
  minimum_received: string;
  from_token: string;
  to_token: string;
}

export async function sendChat(
  message: string,
  walletAddress: string
): Promise<{
  message: string;
  actions: ActionData[];
}> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, wallet_address: walletAddress }),
  });

  if (!res.ok) {
    throw new Error(`Chat failed: ${res.statusText}`);
  }

  return res.json();
}

export async function streamChat(
  message: string,
  walletAddress: string,
  onContent: (text: string) => void,
  onAction: (action: ActionData) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, wallet_address: walletAddress }),
  });

  if (!res.ok) {
    onError(`Request failed: ${res.statusText}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "content") onContent(data.data);
          else if (data.type === "action") onAction(data.data);
          else if (data.type === "done") onDone();
          else if (data.type === "error") onError(data.data);
        } catch {}
      }
    }
  }
}

export async function getPortfolio(
  walletAddress: string
): Promise<PortfolioData> {
  const res = await fetch(`${API_BASE}/portfolio/${walletAddress}`);
  if (!res.ok) throw new Error(`Portfolio fetch failed`);
  return res.json();
}

export async function getQuote(
  fromToken: string,
  toToken: string,
  amount: string
): Promise<QuoteData> {
  const res = await fetch(`${API_BASE}/quote/${fromToken}/${toToken}/${amount}`);
  if (!res.ok) throw new Error(`Quote fetch failed`);
  return res.json();
}

export async function getWalletInfo(
  userAddress: string
): Promise<{ user_address: string; agent_wallet: string | null; has_wallet: boolean }> {
  const res = await fetch(`${API_BASE}/wallet/${userAddress}`);
  if (!res.ok) throw new Error(`Wallet info fetch failed`);
  return res.json();
}
