# 3D Animated Shorts Studio

An AI-powered 3D animated video production studio that enables creators to generate animated cartoon videos and YouTube Shorts (9:16 vertical MP4 format) from text ideas to finished downloadable video.

---

## Architecture Highlights
- **Real 3D Animation:** Three.js and React Three Fiber power actual 3D character rigs, environments, lighting, and camera paths.
- **Dedicated Rendering Worker:** Heavy video composition, offscreen WebGL rendering, and FFmpeg encoding run exclusively on background workers using BullMQ and Redis.
- **Provider-Agnostic AI & Voice:** Pluggable adapters supporting OpenRouter, OpenAI, Anthropic, ai33.pro Unified v3 Voice API (ElevenLabs, Minimax, Clone, Edge, Kokoro, Vbee, FishAudio), and deterministic offline mock engines.
- **Persistent Asset & Project Management:** Supabase database and flexible storage adapters (local filesystem, Supabase Storage, S3).
- **Safe Secrets Architecture:** Zero private provider API keys or service tokens are exposed to client-side bundles.

---

## Monorepo Layout

```
3d-animated-shorts-studio/
├── apps/
│   ├── web/               # React / Vite / Tailwind / R3F Studio UI
│   ├── api/               # Express / Node.js backend orchestration API
│   └── worker/            # Background Remotion & FFmpeg rendering worker
├── packages/
│   ├── types/             # Domain TypeScript interfaces and Zod schemas
│   ├── ai-adapters/       # LLM & Voice synthesis provider adapters
│   ├── 3d-engine/         # Procedural character rigs, environments & camera math
│   ├── video-compositor/  # Remotion compositions, sequencing & subtitles
│   ├── storage/           # Object storage abstraction (local / Supabase / S3)
│   ├── database/          # Supabase SQL migrations and database client
│   └── config/            # Shared TypeScript configs & linting rules
├── docs/                  # Architecture & operational documentation
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── PROGRESS.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   └── KNOWN_LIMITATIONS.md
├── .env.example           # Safe environment variable template
├── pnpm-workspace.yaml    # Workspace package definitions
├── package.json           # Root monorepo scripts & dev tooling
└── turbo.json             # Turborepo task pipeline configuration
```

---

## Documentation
- [System Architecture](docs/ARCHITECTURE.md)
- [Phased Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Progress Tracker](docs/PROGRESS.md)
- [Testing & Verification Strategy](docs/TESTING.md)
- [Deployment & Infrastructure Guide](docs/DEPLOYMENT.md)
- [Technical Dependencies & Known Limitations](docs/KNOWN_LIMITATIONS.md)

---

## Status
- **Current Phase:** Phase 1 (Project Foundation and AI Story Engine) — **Completed (100%)**.
- **Next Phase:** Phase 2 (Character Studio and 3D World Studio) — **Ready to start**.

