import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolkaAgent - AI DeFi Copilot on Polkadot Hub",
  description:
    "AI-powered autonomous wallet that converts natural language intents into real on-chain transactions on Polkadot Hub.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-polka-dark antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
