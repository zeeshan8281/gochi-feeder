"use client";

import { useEffect, useRef, useState } from "react";
import { APP_ID, DEPLOY_TX, IMAGE_REF, INSTANCE, DASHBOARD_URL, TX_URL } from "./config";

type Feed = { name: string; at: number };

function ago(t: number) {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function shorten(s: string, head = 6, tail = 4) {
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export default function Page() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [recent, setRecent] = useState<Feed[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [showProof, setShowProof] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function refresh() {
    try {
      const [r, h] = await Promise.all([
        fetch("/api/recent", { cache: "no-store" }),
        fetch("/api/health", { cache: "no-store" }),
      ]);
      const rj = await r.json();
      const hj = await h.json();
      setRecent(rj.recent ?? []);
      setOnline(Boolean(hj.ok));
    } catch {
      setOnline(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    const tick = setInterval(() => setRecent((r) => [...r]), 1000);
    return () => { clearInterval(id); clearInterval(tick); };
  }, []);

  function flash(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  async function feed(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const r = await fetch("/api/feed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (r.ok) {
        flash("ok", "✓ treat delivered — watch the pet");
        setName("");
        refresh();
      } else {
        const j = await r.json().catch(() => ({}));
        flash("err", j.error || "hmm, try again");
      }
    } catch {
      flash("err", "offline?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto max-w-[640px] px-5 pt-8 pb-24">
      {/* Top status bar */}
      <header className="mb-10 flex items-center justify-between text-sm">
        <button
          onClick={() => setShowProof(true)}
          className="group flex items-center gap-2 rounded-full border border-trust/30 bg-trust/5 px-3 py-1.5 text-trust transition hover:bg-trust/10 hover:glow-trust"
          title="Click to inspect attestation"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-pulseDot rounded-full bg-trust" />
            <span className="h-2 w-2 rounded-full bg-trust" />
          </span>
          <span className="font-medium tracking-wide">TEE&nbsp;Verified</span>
          <span className="text-trust/60 transition group-hover:text-trust">·</span>
          <span className="text-trust/60 transition group-hover:text-trust">EigenCloud</span>
        </button>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              online === null ? "bg-muted/50" : online ? "bg-trust" : "bg-rose-400"
            }`}
          />
          {online === null ? "checking…" : online ? "relay live" : "relay offline"}
        </span>
      </header>

      {/* Hero */}
      <section className="text-center">
        <div className="mb-6 animate-float text-[110px] leading-none drop-shadow-[0_18px_30px_rgba(255,126,182,0.4)]">
          🐣
        </div>
        <h1 className="text-balance text-[44px] font-bold leading-[1.05] tracking-tight">
          Feed my <span className="text-pet">gochi</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[440px] text-balance text-[15px] leading-relaxed text-muted">
          A real ESP32 pet on a desk somewhere. Sign a treat — it&apos;ll see your name and
          react within seconds.
        </p>

        <form onSubmit={feed} className="mx-auto mt-8 grid max-w-[360px] gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            maxLength={24}
            autoComplete="off"
            required
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-lg text-white placeholder:text-muted/60 outline-none ring-pet/0 transition focus:border-pet/50 focus:ring-4 focus:ring-pet/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl bg-pet px-6 py-4 text-lg font-bold text-[#1a0d14] transition glow-pink active:translate-y-[1px] disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "sending…" : "🍪  Feed it"}
          </button>
        </form>

        <div className="mt-3 h-6 text-sm font-semibold">
          {toast && (
            <span className={toast.kind === "ok" ? "text-soft" : "text-rose-300"}>{toast.msg}</span>
          )}
        </div>
      </section>

      {/* Recently fed */}
      <section className="mt-12 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[1.5px] text-muted">
            Recently fed by
          </h2>
          <span className="text-xs text-muted/70">{recent.length} treats</span>
        </div>
        {recent.length === 0 ? (
          <p className="py-3 text-sm text-muted/80">no one yet — be the first</p>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {recent.map((r, i) => (
              <li
                key={`${r.at}-${i}`}
                className="flex items-center justify-between py-2.5 text-[15px]"
              >
                <span className="truncate font-medium text-white/90">{r.name}</span>
                <span className="ml-3 shrink-0 text-xs text-muted">{ago(r.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* How does this work? */}
      <section className="mt-16">
        <h2 className="mb-1 text-center text-[11px] font-semibold uppercase tracking-[2px] text-trust/80">
          How does this work?
        </h2>
        <h3 className="mb-6 text-balance text-center text-2xl font-semibold tracking-tight">
          A relay you can <span className="text-trust">verify</span>, not just trust.
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card
            num="1"
            title="You sign a treat"
            body="Your name is POSTed to a tiny relay running on EigenCloud — a public endpoint anyone on the internet can reach."
          />
          <Card
            num="2"
            title="Sealed in a TEE"
            body={
              <>
                The relay runs inside an{" "}
                <span className="font-medium text-trust">Intel TDX</span> hardware enclave.
                EigenCloud&apos;s operators can&apos;t read the queue, swap names, or inject fakes.
              </>
            }
          />
          <Card
            num="3"
            title="Pet reacts"
            body="A local poller on my Mac drains the queue and tells the ESP32 to flash a happy face + scroll “FED BY YOU”."
          />
        </div>
      </section>

      {/* Proof card */}
      <section className="mt-10 overflow-hidden rounded-3xl border border-trust/25 bg-gradient-to-br from-trust/[0.08] via-transparent to-pet/[0.04] p-6 glow-trust">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[1.5px] text-trust">
              <CheckShield />
              Attestation proof
            </div>
            <p className="max-w-[440px] text-[14px] leading-relaxed text-white/85">
              Every deploy is recorded on Sepolia. The TEE&apos;s on-chip key signs that the
              code running matches the public image — and that the image hasn&apos;t been
              swapped underneath you.
            </p>
          </div>
          <a
            href={DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-trust px-4 py-2.5 text-sm font-semibold text-[#062017] transition hover:brightness-110"
          >
            Verify on EigenCloud
            <span aria-hidden>↗</span>
          </a>
        </div>

        <dl className="mt-5 grid gap-2 text-[13px]">
          <Row k="App ID" v={APP_ID} href={DASHBOARD_URL} mono />
          <Row k="Deploy tx" v={shorten(DEPLOY_TX, 10, 8)} href={TX_URL} mono full={DEPLOY_TX} />
          <Row k="Image" v={IMAGE_REF} mono />
          <Row k="Instance" v={INSTANCE} />
        </dl>

        <button
          onClick={() => setShowProof(true)}
          className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white"
        >
          What does “verifiable” actually mean here? →
        </button>
      </section>

      <footer className="mt-16 text-center text-xs leading-relaxed text-muted">
        built on an ESP32-C3 · devfolio gochi · relay in an{" "}
        <a className="text-pet/80 hover:text-pet" href={DASHBOARD_URL} target="_blank" rel="noreferrer">
          EigenCloud TEE
        </a>
      </footer>

      {showProof && <ProofModal onClose={() => setShowProof(false)} />}
    </main>
  );
}

function Card({ num, title, body }: { num: string; title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/[0.12]">
      <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-trust/15 text-[12px] font-bold text-trust">
        {num}
      </div>
      <div className="mb-1.5 text-[15px] font-semibold text-white">{title}</div>
      <p className="text-[13.5px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Row({
  k,
  v,
  href,
  mono,
  full,
}: {
  k: string;
  v: string;
  href?: string;
  mono?: boolean;
  full?: string;
}) {
  const content = (
    <span
      className={`truncate ${mono ? "font-mono" : ""} text-white/90`}
      title={full || v}
    >
      {v}
    </span>
  );
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.04] bg-black/20 px-3.5 py-2.5">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-[1.2px] text-muted">
        {k}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 truncate text-right text-trust transition hover:underline"
        >
          {content}
        </a>
      ) : (
        <span className="min-w-0 text-right">{content}</span>
      )}
    </div>
  );
}

function CheckShield() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M12 2.5 4 5.5v6c0 4.5 3.5 8.5 8 10 4.5-1.5 8-5.5 8-10v-6l-8-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m8.5 12 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProofModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative max-h-[88vh] w-full max-w-[520px] overflow-y-auto rounded-t-3xl border border-trust/20 bg-[#120e1f] p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-white"
          aria-label="close"
        >
          ✕
        </button>

        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[1.5px] text-trust">
          <CheckShield />
          What verifiable means
        </div>
        <h3 className="mb-5 text-2xl font-semibold tracking-tight">
          Three things make this relay <span className="text-trust">tamper-proof</span>.
        </h3>

        <div className="space-y-4 text-[14px] leading-relaxed text-white/85">
          <Pillar
            title="Hardware trust"
            body={
              <>
                The relay runs on an <span className="font-medium text-trust">Intel TDX</span>{" "}
                chip. The chip itself encrypts the VM&apos;s memory — even the cloud operator
                (Google Cloud, in this case) can&apos;t peek at what&apos;s inside the queue or
                rewrite the names on the wall. They host the box, but they&apos;re locked out
                of it.
              </>
            }
          />
          <Pillar
            title="Build trust"
            body={
              <>
                EigenCloud bakes the image hash into the on-chain attestation. When you click
                the badge, you&apos;re comparing the hash that&apos;s actually running inside
                the TEE against the public image{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-white/90">
                  {IMAGE_REF}
                </code>
                . If anyone swapped the binary, the hashes wouldn&apos;t match — and the badge
                would refuse to verify.
              </>
            }
          />
          <Pillar
            title="Code trust"
            body={
              <>
                Because the image is public, anyone can read the ~100 lines of relay code and
                see exactly what it does: take a name, queue it, hand it to the local poller,
                publish a wall of who fed when. No hidden logging, no key exfiltration —
                because the code is on display, and the deploy proves that&apos;s what&apos;s
                running.
              </>
            }
          />
        </div>

        <div className="mt-6 grid gap-2 rounded-2xl border border-white/[0.06] bg-black/30 p-4 text-[12.5px]">
          <Row k="App ID" v={APP_ID} href={DASHBOARD_URL} mono />
          <Row k="Tx" v={shorten(DEPLOY_TX, 10, 8)} href={TX_URL} mono />
          <Row k="Instance" v={INSTANCE} />
        </div>

        <a
          href={DASHBOARD_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-trust py-3 text-[14px] font-semibold text-[#062017] transition hover:brightness-110"
        >
          Open the attestation dashboard <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="mb-1.5 text-[13px] font-semibold uppercase tracking-[1.2px] text-trust/90">
        {title}
      </div>
      <p>{body}</p>
    </div>
  );
}
