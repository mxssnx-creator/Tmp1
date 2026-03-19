"use client";

import { useMemo } from "react";

import ChatDisplay from "@/src/components/chat/ChatDisplay";

export default function Home() {
  const sampleGroups = useMemo(() => {
    const now = new Date("2026-03-19T12:00:00.000Z").getTime();

    return [
    {
      id: "trading-alerts",
      title: "Trading System Alerts",
      description: "Critical notifications from the trading engine",
      type: "alert" as const,
      priority: "high" as const,
      messages: [
        {
          id: "alert-1",
          sender: "Engine Monitor",
          timestamp: new Date(now - 5 * 60 * 1000),
          summary: "Market volatility spike detected",
          content: "Market volatility has increased by 45% in the last 10 minutes. Consider adjusting risk parameters. The algorithm is still operational but monitoring closely.",
          type: "warning" as const,
          related: ["BTC/USD", "ETH/USD", "SPY"]
        },
        {
          id: "alert-2",
          sender: "Portfolio Manager",
          timestamp: new Date(now - 15 * 60 * 1000),
          summary: "Profit target reached on BTC position",
          content: "The BTC trading position has reached its profit target of 3.2%. Position will be partially closed to lock in gains while maintaining exposure.",
          type: "success" as const,
          related: ["BTC/USD", "Profit-Loss"]
        }
      ]
    },
    {
      id: "system-notifications",
      title: "System Operations",
      description: "Background system status and maintenance notifications",
      type: "system" as const,
      priority: "normal" as const,
      messages: [
        {
          id: "system-1",
          sender: "Scheduler",
          timestamp: new Date(now - 2 * 60 * 60 * 1000),
          summary: "Daily backup completed successfully",
          content: "Automated backup of all trading data and configurations has been completed. Backup size: 2.4GB, stored on secure cloud storage.",
          type: "info" as const,
          related: ["Backups", "Data Safety"]
        },
        {
          id: "system-2",
          sender: "Performance Monitor",
          timestamp: new Date(now - 4 * 60 * 60 * 1000),
          summary: "Memory optimization completed",
          content: "System memory has been optimized, freeing up 1.2GB of RAM. Trading operations performance improved by 8%.",
          type: "info" as const,
          related: ["Performance", "Optimization"]
        }
      ]
    },
    {
      id: "market-insights",
      title: "Market Intelligence Feed",
      description: "Real-time market analysis and insights",
      type: "notification" as const,
      priority: "low" as const,
      messages: [
        {
          id: "market-1",
          sender: "AI Analyst",
          timestamp: new Date(now - 30 * 60 * 1000),
          summary: "Ethereum bullish signals detected",
          content: "Analysis shows strong buying momentum in Ethereum with positive on-chain metrics. Defi protocols showing increased activity. Consider ETH/USD as primary focus for next trading cycle.",
          type: "info" as const,
          related: ["ETH/USD", "DeFi", "On-Chain"]
        }
      ]
    }
  ];
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#142235_0%,#08111b_45%,#030712_100%)] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
                CTS Operations
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Dashboard initialized
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Core systems are online, the application shell is rendering, and the
                workspace is ready for feature modules, telemetry streams, and command
                surfaces to attach.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Live initialization complete
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Render Engine</p>
              <p className="mt-4 text-3xl font-semibold text-white">Ready</p>
              <p className="mt-2 text-sm text-slate-400">App router and layout shell loaded.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">System Checks</p>
              <p className="mt-4 text-3xl font-semibold text-white">Pass</p>
              <p className="mt-2 text-sm text-slate-400">Build, lint, and type integrity confirmed.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Module State</p>
              <p className="mt-4 text-3xl font-semibold text-white">Standby</p>
              <p className="mt-2 text-sm text-slate-400">Ready for data, auth, and dashboard widgets.</p>
            </div>
          </div>
        </div>

        {/* Chat Display Section */}
        <ChatDisplay groups={sampleGroups} />

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Initialization Timeline</h2>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                Boot sequence
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white">01. Shell mounted</p>
                <p className="mt-1 text-sm text-slate-400">Root layout, metadata, and global styles attached.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white">02. CTS dashboard surfaced</p>
                <p className="mt-1 text-sm text-slate-400">Primary interface rendered with visible status cards.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white">03. Ready for integration</p>
                <p className="mt-1 text-sm text-slate-400">Next step is wiring real data sources and workflows.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
            <h2 className="text-xl font-semibold text-white">Current Loadout</h2>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-slate-300">UI Shell</span>
                <span className="text-sm font-medium text-emerald-300">Online</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-slate-300">Telemetry</span>
                <span className="text-sm font-medium text-amber-300">Pending</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-slate-300">Auth Layer</span>
                <span className="text-sm font-medium text-amber-300">Pending</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-slate-300">Command Bus</span>
                <span className="text-sm font-medium text-amber-300">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
