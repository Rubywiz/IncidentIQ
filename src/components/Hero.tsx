'use client';

interface HeroProps {
  onLaunch: () => void;
  onTrigger: () => void;
}

export default function Hero({ onLaunch, onTrigger }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-bg-hero min-h-screen flex flex-col">
      {/* Glowing orb background (Serendale Looper BG) */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70 animate-float"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/figma/looper-orb.png"
          alt=""
          className="w-[1400px] max-w-none -translate-y-20"
        />
      </div>
      {/* Radial vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(105,86,251,0.18), transparent 55%), linear-gradient(180deg, transparent 60%, #0b0e14 100%)',
        }}
        aria-hidden
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚨</span>
          <span className="font-display font-semibold text-xl tracking-tight">IncidentIQ</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-text-soft font-sans">
          <a href="#dashboard" className="hover:text-white transition">Dashboard</a>
          <a href="#agents" className="hover:text-white transition">Agents</a>
          <a
            href="https://github.com/Rubywiz/IncidentIQ"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition"
          >
            GitHub
          </a>
        </div>
        <span className="text-xs text-text-soft bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          Band of Agents · Track 3
        </span>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-8 text-xs text-text-soft bg-white/5 border border-white/10 px-4 py-2 rounded-full font-sans">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          4 agents online · coordinating through Band
        </div>

        <h1 className="font-display font-medium text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
          Resolve production incidents.
          <br />
          <span className="gradient-text">In under two minutes.</span>
        </h1>

        <p className="font-sans text-lg text-text-soft max-w-2xl mb-10 leading-relaxed">
          The moment an alert fires, a Band room spins up and four agents coordinate in real time —
          triaging logs, diffing the culprit deploy, and drafting a fix. Every action waits on
          human approval.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onLaunch}
            className="gradient-purple glow-purple text-white font-semibold px-8 py-4 rounded-xl text-base hover:scale-[1.03] transition font-sans"
          >
            Launch Dashboard →
          </button>
          <button
            onClick={onTrigger}
            className="border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-base transition font-sans"
          >
            🚨 Trigger Demo Incident
          </button>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-8 md:gap-16 mt-20 font-sans">
          {[
            { value: '45–90m', label: 'Industry avg MTTR' },
            { value: '<2m', label: 'IncidentIQ MTTR' },
            { value: '$5,600', label: 'Cost per minute saved' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-semibold gradient-text">
                {s.value}
              </div>
              <div className="text-xs md:text-sm text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 pb-10 text-center text-text-muted text-xs font-sans">
        ↓ scroll to live incident dashboard
      </div>
    </section>
  );
}
