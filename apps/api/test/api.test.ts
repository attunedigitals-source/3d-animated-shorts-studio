import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('API Integration Test Suite', () => {
  const aliceHeaders = {
    'x-user-id': 'user-alice',
    'Content-Type': 'application/json',
  };

  const bobHeaders = {
    'x-user-id': 'user-bob',
    'Content-Type': 'application/json',
  };

  describe('GET /health', () => {
    it('should return health status with database info', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('@studio/api');
      expect(res.body.database).toBeDefined();
      expect(typeof res.body.database.healthy).toBe('boolean');
    });
  });

  describe('404 Not Found Handler', () => {
    it('should return 404 for nonexistent route', async () => {
      const res = await request(app).get('/api/nonexistent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('Auth Endpoints (/api/auth)', () => {
    it('should log in or register user in dev/local mode', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return current user session with x-user-id', async () => {
      const res = await request(app)
        .get('/api/auth/session')
        .set(aliceHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe('user-alice');
    });

    it('should handle logout', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Settings Endpoints (/api/settings)', () => {
    it('should get public configuration without exposing private secrets', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set(aliceHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ai).toBeDefined();
      expect(res.body.data.ai.model).toBeDefined();
      expect(res.body.data.availableModels.length).toBeGreaterThan(0);
      // Ensure no raw secret keys leaked
      expect(res.body.data.ai.apiKey).toBeUndefined();
    });

    it('should test connection for mock provider', async () => {
      const res = await request(app)
        .post('/api/settings/test-connection')
        .set(aliceHeaders)
        .send({ provider: 'mock' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connected).toBe(true);
      expect(res.body.data.provider).toBe('mock');
    });
  });

  describe('Project Management & Access Isolation (/api/projects)', () => {
    let aliceProjectId: string;

    it('should reject invalid project creation payloads', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set(aliceHeaders)
        .send({ title: '' }); // Empty title fails schema

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should allow Alice to create a new project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set(aliceHeaders)
        .send({
          title: 'Alice Wonder Short',
          description: 'A whimsical journey through a mechanical forest',
          targetDurationSeconds: 30,
          category: 'Adventure',
          aspectRatio: '9:16',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Alice Wonder Short');
      expect(res.body.data.userId).toBe('user-alice');
      aliceProjectId = res.body.data.id;
    });

    it('should list projects for Alice including the newly created project', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set(aliceHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.find((p: any) => p.id === aliceProjectId);
      expect(found).toBeDefined();
    });

    it('should NOT allow Bob to see Alice project in project list (user isolation)', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set(bobHeaders);

      expect(res.status).toBe(200);
      const found = res.body.data.find((p: any) => p.id === aliceProjectId);
      expect(found).toBeUndefined();
    });

    it('should NOT allow Bob to fetch Alice project by ID (unauthorized access protection)', async () => {
      const res = await request(app)
        .get(`/api/projects/${aliceProjectId}`)
        .set(bobHeaders);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should allow Alice to update project details', async () => {
      const res = await request(app)
        .patch(`/api/projects/${aliceProjectId}`)
        .set(aliceHeaders)
        .send({ description: 'Updated description for Alice short' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated description for Alice short');
    });

    it('should allow Alice to duplicate a project', async () => {
      const res = await request(app)
        .post(`/api/projects/${aliceProjectId}/duplicate`)
        .set(aliceHeaders);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('Alice Wonder Short');
      expect(res.body.data.id).not.toBe(aliceProjectId);

      // Clean up duplicated project
      await request(app)
        .delete(`/api/projects/${res.body.data.id}`)
        .set(aliceHeaders);
    });
  });

  describe('Full AI Story, Script & Scene Breakdown Pipeline', () => {
    let testProjectId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/projects')
        .set(aliceHeaders)
        .send({
          title: 'The Clockwork Squirrel',
          description: 'A robot squirrel hoarding nuts in autumn',
          targetDurationSeconds: 30,
        });
      testProjectId = res.body.data.id;
    });

    it('should generate an AI story for the project and persist it', async () => {
      const res = await request(app)
        .post('/api/stories/generate')
        .set(aliceHeaders)
        .send({
          projectId: testProjectId,
          options: {
            topic: 'A metallic squirrel collecting glowing acorns in a cyberpunk city',
            category: 'Sci-Fi',
            targetDurationSeconds: 30,
            intendedAudience: 'Teens & Young Adults',
            tone: 'Fast-paced and witty',
            visualStyle: 'Stylized 3D Cartoon',
            language: 'English',
          },
          settings: { mockAi: true },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.story).toBeDefined();
      expect(res.body.data.story.title).toBeTruthy();
      expect(res.body.data.story.logline).toBeTruthy();
      expect(res.body.data.story.characterDescriptions.length).toBeGreaterThan(0);
      expect(res.body.data.metadata.status).toBe('success');

      // Verify persistence via GET /api/stories/:projectId
      const getRes = await request(app)
        .get(`/api/stories/${testProjectId}`)
        .set(aliceHeaders);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.title).toBe(res.body.data.story.title);
    });

    it('should generate an AI script from the persisted story', async () => {
      const res = await request(app)
        .post('/api/scripts/generate')
        .set(aliceHeaders)
        .send({
          projectId: testProjectId,
          targetDurationSeconds: 30,
          settings: { mockAi: true },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.script).toBeDefined();
      expect(res.body.data.script.scenes.length).toBeGreaterThan(1);
      expect(res.body.data.script.totalEstimatedDurationSeconds).toBe(30);

      // Verify persistence via GET /api/scripts/:projectId
      const getRes = await request(app)
        .get(`/api/scripts/${testProjectId}`)
        .set(aliceHeaders);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.scenes.length).toBe(res.body.data.script.scenes.length);
    });

    it('should break down script into structured 3D production scenes', async () => {
      const res = await request(app)
        .post('/api/scenes/breakdown')
        .set(aliceHeaders)
        .send({
          projectId: testProjectId,
          settings: { mockAi: true },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scenes).toBeDefined();
      expect(res.body.data.scenes.length).toBeGreaterThan(0);

      const firstScene = res.body.data.scenes[0];
      expect(firstScene.environmentDescription).toBeTruthy();
      expect(firstScene.cameraDirectionSuggestions).toBeTruthy();
      expect(firstScene.propsRequired).toBeDefined();

      // Verify persistence via GET /api/scenes/:projectId
      const getRes = await request(app)
        .get(`/api/scenes/${testProjectId}`)
        .set(aliceHeaders);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBe(res.body.data.scenes.length);

      // Test updating a single scene via PATCH
      const sceneId = firstScene.id;
      const patchRes = await request(app)
        .patch(`/api/scenes/${testProjectId}/${sceneId}`)
        .set(aliceHeaders)
        .send({
          cameraDirectionSuggestions: 'Dramatic Dutch angle low shot rotating 45 degrees',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.cameraDirectionSuggestions).toBe('Dramatic Dutch angle low shot rotating 45 degrees');
    });

    it('should delete project and clean up', async () => {
      const delRes = await request(app)
        .delete(`/api/projects/${testProjectId}`)
        .set(aliceHeaders);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const checkRes = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set(aliceHeaders);

      expect(checkRes.status).toBe(404);
    });
  });
});
