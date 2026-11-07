# 3D Animated Shorts Studio — Phased Implementation Plan

## Overview & Execution Strategy

Development of **3D Animated Shorts Studio** is partitioned into eight strictly sequential phases. Each phase establishes a verified, testable layer of system functionality. Progression from one phase to the next requires satisfying all acceptance criteria and obtaining explicit user sign-off.

---

## Phase 1: Project Foundation and AI Story Engine

### 1.1. Goal & Scope
Establish the operational monorepo infrastructure, database migrations, base types, UI layout shell, and the provider-agnostic AI Story & Script generation engine.

### 1.2. Key Deliverables
- Fully configured monorepo workspace (`pnpm`, `turbo`, strict TypeScript configuration).
- Initialized Supabase schema (`projects`, `stories`, `scenes`, `characters`).
- `@studio/types`: Core data models and Zod validation schemas for stories and scripts.
- `@studio/ai-adapters`: Self-hosted AWS Ollama adapter, OpenAI/Anthropic fallback adapters, and deterministic mock adapter.
- `apps/api`: REST endpoints for project creation, story generation, and script breakdown.
- `apps/web`: Studio layout shell (header, sidebar, navigation, project state manager, concept prompt input, and script review panel).

### 1.3. Acceptance Criteria
- [x] Monorepo builds cleanly (`turbo run build`) and passes typecheck (`turbo run typecheck`).
- [x] Database schema is deployed or reproducible via local Supabase migrations (`migrations/001_phase1_schema.sql` with RLS + persistent dev fallback).
- [x] AI adapter generates structured stories conforming strictly to `StoryDocument` format with hook, rising action, climax, and resolution.
- [x] Mock AI mode operates offline deterministically without requiring external API keys.
- [x] Frontend user can input a prompt, view the AI-generated script broken into scenes, edit lines, and save the project to the database.

### 1.4. Verification Tests
- [x] Unit test: Validate `StoryDocumentSchema` parsing with valid and invalid LLM JSON outputs (Passed).
- [x] Integration test: `POST /api/stories/generate` returns 200 with complete story metadata when given a topic (Passed).
- [x] End-to-end integration test: Full API workflow test suite in `apps/api/test/api.test.ts` (18 passing tests verifying user isolation, projects CRUD, story generation, script breakdown, scene management, and settings).

---

## Phase 2: Character Studio and 3D World Studio

### 2.1. Goal & Scope
Build the 3D visual foundations: procedural cartoon character creation, customizable color palettes, facial expressions, bone rigs, and procedural 3D environments with dynamic lighting.

### 2.2. Key Deliverables
- `@studio/3d-engine`: Procedural humanoid cartoon rig (head, eyes, mouth, torso, limbs) built using Three.js primitives and skinned meshes.
- Character Studio UI: Palette pickers, proportion sliders, facial emotion selectors (happy, angry, surprised, sad, neutral).
- 3D World Studio: Environment presets (Indoor Room, Outdoor Park, Sci-Fi Corridor, Custom Stage).
- Dynamic lighting presets (Daylight Sunny, Golden Hour, Night Cyberpunk, Dramatic Noir).
- Real-time React Three Fiber viewport with orbit controls and character inspection.

### 2.3. Acceptance Criteria
- [ ] Character models render in real-time WebGL canvas at 60 FPS without lag.
- [ ] Modifying character color palettes, skin tones, or proportions updates the 3D model immediately.
- [ ] Switching character emotions animates facial blend shapes or procedural facial features accurately.
- [ ] Changing environment presets swaps background geometry, skybox, ambient lighting, and shadows cleanly.
- [ ] Character definitions and environment configurations persist to the database per project.

### 2.4. Verification Tests
- Unit test: Rig hierarchy creation and bone transformation math.
- Component test: R3F Canvas mounts and renders character mesh without WebGL context loss.
- Visual inspection test: Confirm procedural characters maintain consistent proportions across scene changes.

---

## Phase 3: Animation Engine, Camera Controls, Timeline and Remotion Integration

### 3.1. Goal & Scope
Implement character movement keyframing, facial expression transitions, dynamic camera choreography (pans, zooms, Dutch angles), a multi-track interactive timeline editor, and Remotion composition scaffolding.

### 3.2. Key Deliverables
- `@studio/3d-engine`: Keyframe interpolator for character positions, rotations, and poses using cubic Bezier curves and easing functions.
- Camera Choreography System: Preset camera shots (Wide Establishing, Medium Shot, Close-Up, Low-Angle Dramatic) and smooth camera transitions.
- Interactive Timeline Editor: Multi-track timeline in `apps/web` with play/pause, scrub head, scene dividers, and keyframe markers.
- `@studio/video-compositor`: Remotion composition structure syncing 3D canvas frames with timeline timing.

### 3.3. Acceptance Criteria
- [ ] Characters animate smoothly along defined paths between keyframes without popping or jitter.
- [ ] Camera tracks target points and transitions seamlessly across keyframed coordinates.
- [ ] Timeline scrubber updates the 3D scene instantaneously to the exact frame time.
- [ ] Remotion player in the browser can preview the synchronized composition.

### 3.4. Verification Tests
- Unit test: Linear and cubic spline camera path calculations.
- Timeline test: Scrubber at time `t` accurately calculates expected transform matrix for all active actors.
- Playback benchmark: Sustained 30+ FPS during animation preview in client browser.

---

## Phase 4: Voice Generation and Audio Production

### 4.1. Goal & Scope
Integrate text-to-speech voice generation, dialogue timing alignment, background music beds, sound effects (SFX), and multi-track audio sequencing.

### 4.2. Key Deliverables
- `@studio/ai-adapters`: `ai33.pro` Unified v3 integration adapter (TTS, multi-speaker dialogue, voice library, voice cloning, pronunciation dictionaries) and offline mock audio synthesizer.
- Audio Asset Manager: Storage and retrieval of synthesized speech clips, royalty-free BGM, and SFX.
- Automated Dialogue Timing: Audio duration inspection to automatically size scene duration.
- Character Lip-Sync Approximation: Phoneme/volume-based jaw movement cues synced to speech playback.
- Multi-track Audio Timeline: Dedicated audio tracks for dialogue, music, and sound effects with volume envelopes.

### 4.3. Acceptance Criteria
- [ ] Speech synthesis generates natural dialogue audio files from scene scripts.
- [ ] Audio waveforms and duration indicators appear directly on the timeline editor.
- [ ] Scene lengths automatically adjust to fit the duration of the dialogue audio.
- [ ] Character mouth meshes animate in synchronization with speech playback.
- [ ] Background music volume can duck during character speech.

### 4.4. Verification Tests
- Unit test: Audio duration parsing and waveform generation.
- Integration test: Voice generation API call returns valid audio buffer and persists to storage.
- Sync test: Audio playhead and 3D animation playhead remain synchronized within 50ms tolerance.

---

## Phase 5: Rendering Worker, FFmpeg Processing and MP4 Export

### 5.1. Goal & Scope
Construct the background rendering worker (`apps/worker`), Redis/BullMQ job processing queue, headless Remotion/Puppeteer rendering pipeline, FFmpeg audio-video multiplexer, and MP4 export generator.

### 5.2. Key Deliverables
- `apps/worker`: BullMQ consumer listening for `render-short` jobs.
- Headless WebGL / Remotion render pipeline: Frame-by-frame offscreen rendering at 1080x1920 (9:16 vertical video) at 30 FPS.
- FFmpeg Video Pipeline: H.264 video encoding, AAC audio encoding, subtitle burn-in, and final MP4 packaging.
- Progress Reporting: Granular progress updates (percentage, current scene, frame count) published to Redis and Supabase.
- Storage Upload: Exported MP4 stored in object storage and made available via secure download link.

### 5.3. Acceptance Criteria
- [ ] Rendering is performed entirely by the background worker, never freezing or blocking the user's browser.
- [ ] Real-time progress percentage reflects actual frame rendering status.
- [ ] Output is a downloadable, valid MP4 video at 1080x1920 resolution playable in standard media players and YouTube Shorts.
- [ ] Audio, dialogue, music, and 3D visual animations are perfectly synchronized in the rendered MP4.
- [ ] Failed render jobs clean up temporary disk files and report clear diagnostic error messages.

### 5.4. Verification Tests
- Worker integration test: Submit a dummy render job to BullMQ, verify worker dequeues, processes, and completes.
- FFmpeg integrity test: Run `ffprobe` on the output MP4 to verify video codec (h264), audio codec (aac), resolution (1080x1920), and frame rate.
- Error recovery test: Force kill a sub-process and confirm job status transitions to `failed` with cleaned temp directories.

---

## Phase 6: One-Click AI Production and Guided Production Workflow

### 6.1. Goal & Scope
Provide two cohesive user journeys:
1. **One-Click Automated Production:** User inputs a prompt and style, and the studio automatically handles script generation, character creation, scene composition, voice synthesis, camera choreography, and queueing for rendering.
2. **Guided Production:** Step-by-step wizard where the creator approves/tweaks the script, chooses character styles, adjusts camera shots, previews audio, and approves final rendering.

### 6.2. Key Deliverables
- Automated Orchestrator Service: End-to-end pipeline coordinating AI script -> character creation -> scene setup -> audio -> render.
- Guided Step-by-Step Wizard UI: Step indicators (Concept -> Script -> Cast -> Staging -> Audio -> Export) with review gates.
- Project Duplication & Versioning: Save checkpoints and duplicate project templates.
- Production Dashboard: View in-progress, completed, and draft video projects.

### 6.3. Acceptance Criteria
- [ ] One-Click mode transforms a single text prompt into a fully queued render job without manual intervention.
- [ ] Guided mode allows creator to modify any stage before advancing to the next.
- [ ] The user can cancel an in-flight automated production at any checkpoint.
- [ ] Saved projects can be reloaded at any time with all 3D assets, script lines, and settings restored.

### 6.4. Verification Tests
- E2E flow test: Execute complete One-Click pipeline from prompt to queued job using mock adapters.
- Wizard state test: Navigate forward and backward through the Guided Wizard ensuring state is never lost.

---

## Phase 7: Quality Assurance, Security, Error Handling and Reliability

### 7.1. Goal & Scope
Harden the entire application stack: API security, rate limiting, WebGL context loss recovery, robust validation, logging, and comprehensive error handling.

### 7.2. Key Deliverables
- Security Hardening: API rate limiters, input sanitization, Supabase RLS policies, CORS validation.
- WebGL Context Recovery: Auto-restore Three.js canvas when WebGL context is lost or restored by the OS/GPU.
- Comprehensive Error Modals & Diagnostic Reports: User-friendly error messaging for AI outages, rendering errors, and network disconnects.
- Structured Logging: Centralized logging across API and Worker with correlation IDs.

### 7.3. Acceptance Criteria
- [ ] API rejects malformed payloads and malicious inputs with HTTP 400 and structured error responses.
- [ ] Simulated WebGL context loss does not crash the web app; canvas recovers smoothly.
- [ ] Third-party API failures (Ollama/ai33.pro) trigger graceful fallbacks or actionable user prompts.
- [ ] No private keys or service tokens appear in browser bundles or client network traces.

### 7.4. Verification Tests
- Security audit: Automated scan of frontend bundle for leaked secrets or env variables.
- Fault injection test: Inject network timeouts during voice generation and verify retries and user alerts.
- Context loss test: Trigger `gl.getExtension('WEBGL_lose_context').loseContext()` and verify auto-recovery.

---

## Phase 8: Complete Integration, Testing and Deployment

### 8.1. Goal & Scope
Final end-to-end system testing, performance optimization, production containerization (Docker), documentation finalization, and production deployment readiness.

### 8.2. Key Deliverables
- Dockerfiles: Production multi-stage Dockerfile for `apps/api` and `apps/worker` (including Chromium and FFmpeg).
- Production deployment scripts and environment validation checklists.
- End-to-end integration test suite running in CI.
- Final user guide and developer documentation.

### 8.3. Acceptance Criteria
- [ ] All unit, integration, and E2E tests pass cleanly in automated CI runs.
- [ ] Docker containers build successfully and execute without permission or environment issues.
- [ ] Complete pipeline renders a 30-second 1080x1920 MP4 video in under 3 minutes on standard worker instances.
- [ ] All documentation matches actual production code and architecture.

### 8.4. Verification Tests
- Full regression test: Generate, animate, synthesize, and render 3 distinct shorts with different themes.
- Containerized health test: Launch API and Worker containers, execute rendering job, verify output file integrity.

---

## Immediate Next Steps: Kicking Off Phase 1

Upon receiving explicit user approval to proceed with **Phase 1**, the following discrete implementation steps will be executed:
1. **Dependency Installation & Workspace Setup:** Install necessary workspace dependencies (`turbo`, `zod`, `express`, `vite`, `three`, etc.) using `pnpm install` outside sandbox.
2. **Types & Validation:** Implement complete Zod schemas and TypeScript interfaces in `@studio/types` for projects, stories, scenes, and dialogues.
3. **AI Adapter Engine:** Build `@studio/ai-adapters` with self-hosted Ollama client, structured prompt templates, JSON schema parsers, and the deterministic mock adapter.
4. **Backend API Endpoints:** Build `apps/api` story routes (`/api/stories/generate`, `/api/stories/:id/expand`, `/api/projects`).
5. **Frontend Studio Shell:** Build `apps/web` layout, theme, story prompt UI, and scene review panel connected to the API.
6. **Phase 1 Verification:** Execute unit and integration tests, verify end-to-end story generation, and request user sign-off.

