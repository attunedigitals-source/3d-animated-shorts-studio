# 3D Animated Shorts Studio — Technical Dependencies & Known Limitations

## 1. Technical Dependencies Overview

| Category | Primary Library / Technology | Version Target | Critical Role |
| :--- | :--- | :--- | :--- |
| **Monorepo Engine** | Turborepo / pnpm | Turbo 2.x, pnpm 9.x | High-performance monorepo build orchestration |
| **Frontend Framework** | React + Vite | React 18.x, Vite 5.x | High-speed SPA with fast HMR |
| **3D Engine** | Three.js + React Three Fiber | Three 0.169.x, R3F 8.x | Real-time scene graph, rigging, and camera control |
| **Video Compositor** | Remotion | Remotion 4.x | Frame-level video composition and rendering orchestration |
| **Video Processing** | FFmpeg & FFprobe | FFmpeg 6.x+ | H.264/AAC muxing, audio filter graphs, MP4 packaging |
| **Queue & Cache** | Redis & BullMQ | Redis 7.x, BullMQ 5.x | Distributed asynchronous rendering job queue |
| **Database & Auth** | Supabase (PostgreSQL) | Supabase JS 2.x | Relational persistence, JSONB scene specs, asset storage |
| **AI Language** | OpenRouter (or OpenAI/Anthropic) | REST API | Multi-model script generation and scene breakdown |
| **AI Voice** | ai33.pro (Unified v3) | REST API | Character voice synthesis (ElevenLabs, Minimax, Clone, Edge, Kokoro, Vbee, FishAudio) & multi-speaker dialogue |

---

## 2. Technical Limitations & Compatibility Risks

### 2.1. Headless WebGL & 3D Frame Rasterization
- **Challenge:** Headless rendering environments (such as Docker containers or Linux worker VMs) lack physical display monitors and physical GPUs by default. Standard Three.js WebGL canvas rendering will fail without hardware acceleration or software rasterization.
- **Risk:** Headless Chrome in Remotion may throw `WebGL context could not be created` or render solid black frames.
- **Mitigation Strategy:**
  1. In containerized environments, Chromium is launched with flags `--use-gl=angle`, `--use-angle=swiftshader`, or `--enable-webgl`.
  2. For high-volume production, instances with GPU passthrough (`/dev/dri`) or AWS `g4dn` instances provide native hardware acceleration.
  3. Frame validation checks are enforced in `@studio/worker` to ensure rendered PNG frames contain non-zero pixel entropy before encoding.

### 2.2. Remotion & FFmpeg Memory Overhead
- **Challenge:** 9:16 vertical video at 1080x1920 resolution requires significant RAM buffer per frame (~8 MB uncompressed RGBA per frame). A 30-second video at 30 FPS consists of 900 individual frames.
- **Risk:** Running multiple concurrent render workers on low-spec VMs can trigger Linux OOM (Out Of Memory) killer.
- **Mitigation Strategy:**
  1. Enforce strict `WORKER_CONCURRENCY=2` on 8GB machines.
  2. Stream frames directly from Remotion into FFmpeg stdin via pipes rather than buffering all 900 frames in RAM.
  3. Clean up temporary frame caches immediately upon completion or error.

### 2.3. Browser WebGL Context Loss on Low-End Devices
- **Challenge:** Mobile devices and laptops with integrated graphics may throttle or drop WebGL contexts if the user opens multiple tabs or GPU memory runs high.
- **Risk:** Viewport canvas crashes to a blank or frozen screen.
- **Mitigation Strategy:**
  1. Low-poly stylized cartoon aesthetic deliberately limits total polygon count to < 100k triangles per scene.
  2. Implement `webglcontextlost` and `webglcontextrestored` event listeners in `@studio/web` to reload the 3D scene cleanly without losing state.

### 2.4. AI Model Variability & Structured Schema Conformance
- **Challenge:** LLM responses can occasionally contain conversational filler, markdown formatting bugs, or altered JSON keys, especially across different models on OpenRouter.
- **Risk:** Script parsing exceptions and broken scene breakdowns.
- **Mitigation Strategy:**
  1. Enforce JSON schema validation via Zod (`StoryDocumentSchema`).
  2. Implement robust JSON extractor utility that strips markdown fences (````json ... ````) and conversational preamble.
  3. Provide automatic prompt retry (up to 2 retries) with structured repair prompts upon validation failure.
  4. Provide the fully deterministic `mock` adapter for guaranteed local reliability during development.

### 2.5. Audio Lip-Sync & Multi-Speaker Dialogue Pacing
- **Challenge:** Full bone-driven speech lip-sync requires accurate volume envelopes and timing. Multi-speaker dialogue requires consistent gaps between character turns.
- **Risk:** Uncanny valley mouth movements, overlapping voices, or desynchronized speech animation.
- **Mitigation Strategy:**
  1. Utilize `ai33.pro` v3 `delay` parameter to regulate dialogue gaps between speakers (e.g. 0.4s).
  2. Utilize procedural amplitude-based jaw rotation combined with cartoon vowel viseme blend shapes.
  3. Normalize character mouth movement to speech audio volume envelopes to ensure natural cartoon-style stylized articulation.

### 2.6. Redis Durability & BullMQ Eviction
- **Challenge:** If Redis runs out of memory and has a standard `volatile-lru` or `allkeys-lru` eviction policy, active BullMQ queue keys can be evicted, causing dropped render jobs.
- **Risk:** Render jobs getting stuck indefinitely in "queued" state.
- **Mitigation Strategy:**
  1. Configure Redis with `maxmemory-policy noeviction`.
  2. Set job timeouts and stalled job checks in BullMQ (`lockDuration: 30000`, `stalledInterval: 15000`).

