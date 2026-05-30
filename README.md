# gochi-feeder

Public petting station for an ESP32-C3 desk pet. Anyone can feed it from a browser — every treat is cryptographically verifiable.

**Live:** https://feeder-web-nine.vercel.app
**TEE proof:** https://verify-sepolia.eigencloud.xyz/app/0x300Fd1aB21B169f5cdAe9016006126CF93D3A39c

Built on top of the base firmware at [devfolioco/gochi](https://github.com/devfolioco/gochi). This repo contains the additions on top: the relay, the public site, and a bat-signal mode.

## Architecture

```
[Browser] → [Vercel Next.js — HTTPS proxy] → [EigenCloud TEE (Intel TDX) — signal-server + queue]
                                                          ↕
                                              [pet-feeder.sh on my laptop]
                                                          ↓ USB
                                                       [Gochi]
```

See `feeder-web/architecture.excalidraw` for the diagram (open at excalidraw.com).

## What's in here

- `signal-server/` — Node relay running inside an EigenCloud TEE. Endpoints:
  - `POST /feed { name }` — enqueue a treat
  - `GET  /feed/poll`     — 25s long-poll; returns the next queued treat
  - `GET  /recent`        — last few feeds for the "Recently fed by" wall
- `feeder-web/` — Next.js 16 site on Vercel. HTTPS proxy + UI + verification modal.
- `pet-feeder.sh` — runs on whatever machine the gochi is plugged into. Long-polls `/feed/poll`, fires `gochi face happy` + scrolls `FED BY <NAME>` on each hit.
- `bat-mode.sh`, `bat-signal.sh`, `assets/bat.*` — separate "bat-signal" mode that flashes the bat logo and plays the 1966 Batman riff (requires the matching `jingles.cpp` patch on the firmware side).

## Verification

The relay isn't trust-me code. Three things are independently verifiable:

1. **Hardware trust.** It runs in an Intel TDX TEE on `g1-standard-4t`. The TEE produces a signed quote proving the code is running on a real Intel CPU with secure boot and memory encryption.
2. **Build trust.** The container image digest is recorded on Sepolia under App ID `0x300Fd1aB21B169f5cdAe9016006126CF93D3A39c`. The image at `ghcr.io/zeeshan8281/gochi-feeder:latest` is public — pull it, rebuild from this repo, confirm the digest matches what's on chain.
3. **Code trust.** This repo is the source. `signal-server/server.js` is small enough to read end-to-end: the relay can only enqueue/drain feeds. It can't lie about who fed the pet, rewrite history, or skip the queue.

Together: you can prove the bytes I shipped are the bytes serving traffic, and you can read those bytes here.

## Run locally

```sh
# 1. Relay (defaults to :8080)
cd signal-server && node server.js &

# 2. Site (defaults to :3000, proxies http://localhost:8080)
cd feeder-web && npm install && ECLOUD_URL=http://localhost:8080 npm run dev &

# 3. Poller (long-polls the relay, drives the gochi via the gochi CLI)
./pet-feeder.sh http://localhost:8080
```

Open http://localhost:3000, type a name, hit "Feed it" — the queued treat fires on the device.
