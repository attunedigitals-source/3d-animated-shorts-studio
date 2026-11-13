import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Pure AI 3D Studio API Endpoints (Phase 0 Repaired)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('deep-research') || url.includes('gemini-3.1-flash-lite')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        viralHooks: ['Winter of 1812 changed everything.'],
                        obscureFacts: ['Tin buttons turned to dust.'],
                        retentionAngles: ['Desperate survival.'],
                        summary: 'Napoleon retreat.',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      if (url.includes('gemini-2.5-pro')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        title: "Napoleon: The Frozen Descent",
                        character: {
                          name: "Napoleon",
                          role: "Commander",
                          visualIdentityMatrix: {
                            promptTokens: "[CHAR_NAPOLEON_3D_DNA]",
                            facialGeometry: "High cheekbones",
                            skinTone: "Alabaster",
                            hairTexture: "Dark chestnut",
                            wardrobe: "Imperial greatcoat",
                            renderingStyle: "UE5 3D CGI",
                            colorPalette: ["#1A2B4C", "#D4AF37"],
                          },
                        },
                        beats: [
                          {
                            beatNumber: 1,
                            type: "Hook",
                            text: "The blizzard swallowed the army.",
                            visualSceneDescription: "Frozen tundra",
                            action: "Looks ahead",
                            cameraTrajectory: { shotType: "close-up", motion: "push-in", focalLength: "35mm", lighting: "Rim" },
                            targetDurationSeconds: 6,
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      if (url.includes('gemini-4-argon')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [{ content: { parts: [{ text: JSON.stringify({ isContinuous: true }) }] } }],
          }),
        };
      }

      if (url.includes(':predict')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            predictions: [
              {
                bytesBase64Encoded:
                  'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODk=',
              },
            ],
          }),
        };
      }

      if (url.includes('ai33.pro')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            audio_url: 'https://cdn.ai33.pro/sample.mp3',
            alignment: {
              words: [{ word: 'The', start: 0, end: 0.3 }],
            },
          }),
        };
      }

      if (url.includes('gemini-omni-1.2-flash')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        status: "passed",
                        passed: true,
                        characterConsistencyScore: 94,
                        visualFidelityScore: 95,
                        subtitleLegibility: true,
                        feedback: ["All 7 categories verified"],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      };
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('GET /health returns HTTP 200 with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('@studio/api');
  });

  it('POST /api/generate/research validates input and returns research data', async () => {
    // Missing topic -> 400
    const errRes = await request(app).post('/api/generate/research').send({});
    expect(errRes.status).toBe(400);

    const res = await request(app)
      .post('/api/generate/research')
      .set('x-gemini-key', 'AIzaSy_mock_key_12345')
      .send({ topic: 'Napoleon in Moscow 1812' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.viralHooks.length).toBeGreaterThan(0);
  });

  it('POST /api/pipeline/generate runs end-to-end 3D CGI pipeline with secure headers', async () => {
    const res = await request(app)
      .post('/api/pipeline/generate')
      .set('x-gemini-key', 'AIzaSy_mock_key_12345')
      .set('x-ai33-key', 'ai33_mock_key_12345')
      .send({
        topic: 'Napoleon in Moscow winter 1812',
        aspectRatio: '9:16',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.characters.length).toBe(1);
    expect(res.body.data.canonicalSheets.length).toBe(1);
    expect(res.body.data.beats.length).toBe(1);
    expect(res.body.data.shots.length).toBe(1);
    expect(res.body.data.qaReport.passed).toBe(true);
    expect(res.body.data.status).toBe('completed');
  });
});
