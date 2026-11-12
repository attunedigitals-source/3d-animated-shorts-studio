import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Pure AI 3D Studio API Endpoints', () => {
  it('GET /health returns HTTP 200 with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('@studio/api');
  });

  it('POST /api/generate/research returns research data', async () => {
    const res = await request(app)
      .post('/api/generate/research')
      .send({ topic: 'Napoleon in Moscow 1812' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.viralHooks.length).toBeGreaterThan(0);
  });

  it('POST /api/pipeline/generate runs end-to-end 3D CGI pipeline', async () => {
    const res = await request(app)
      .post('/api/pipeline/generate')
      .send({
        topic: 'Napoleon in Moscow winter 1812',
        aspectRatio: '9:16',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.characters.length).toBe(1);
    expect(res.body.data.canonicalSheets.length).toBe(1);
    expect(res.body.data.beats.length).toBeGreaterThanOrEqual(6);
    expect(res.body.data.shots.length).toBe(res.body.data.beats.length);
    expect(res.body.data.qaReport.passed).toBe(true);
  });
});

