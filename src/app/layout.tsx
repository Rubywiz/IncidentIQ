import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IncidentIQ — Multi-Agent Incident Response",
  description:
    "Multi-agent incident response. The moment an alert fires, agents coordinate in real time to triage, investigate, and resolve P0s in under 2 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600,700&f[]=space-grotesk@400,500&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
