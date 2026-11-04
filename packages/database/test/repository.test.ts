import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DevDatabaseRepository } from '../src/dev-repository';
import { StoryDocument, ScriptDocument, StructuredScene } from '@studio/types';

describe('DevDatabaseRepository Unit Tests', () => {
  const testStorePath = path.resolve(process.cwd(), '.temp', 'test_store.json');
  let repo: DevDatabaseRepository;

  const testUserId = 'test-creator-01';
  const otherUserId = 'test-creator-02';

  beforeEach(() => {
    if (fs.existsSync(testStorePath)) {
      fs.unlinkSync(testStorePath);
    }
    repo = new DevDatabaseRepository(testStorePath);
  });

  afterEach(() => {
    if (fs.existsSync(testStorePath)) {
      fs.unlinkSync(testStorePath);
    }
  });

  it('should pass health check', async () => {
    const healthy = await repo.isHealthy();
    expect(healthy).toBe(true);
    expect(repo.isDevFallback()).toBe(true);
  });

  it('should upsert and retrieve user profile', async () => {
    const profile = await repo.upsertProfile({
      id: testUserId,
      email: 'creator@studio.test',
      displayName: 'Lead Creator',
      createdAt: new Date().toISOString(),
    });

    expect(profile.id).toBe(testUserId);
    const fetched = await repo.getProfile(testUserId);
    expect(fetched?.displayName).toBe('Lead Creator');
  });

  it('should create project with defaults and list by user', async () => {
    const project = await repo.createProject(testUserId, {
      title: 'Galactic Pizza Delivery',
      description: 'A sci-fi comedy',
    });

    expect(project.id).toBeTruthy();
    expect(project.title).toBe('Galactic Pizza Delivery');
    expect(project.status).toBe('draft');
    expect(project.preferences.aspectRatio).toBe('9:16');

    const userProjects = await repo.getProjects(testUserId);
    expect(userProjects.length).toBe(1);
    expect(userProjects[0]!.id).toBe(project.id);

    // Isolation check: other user sees empty list
    const otherProjects = await repo.getProjects(otherUserId);
    expect(otherProjects.length).toBe(0);
  });

  it('should protect against unauthorized access across users', async () => {
    const project = await repo.createProject(testUserId, { title: 'Secret Project' });
    const fetchedByOther = await repo.getProject(project.id, otherUserId);
    expect(fetchedByOther).toBeNull();
  });

  it('should update project metadata', async () => {
    const project = await repo.createProject(testUserId, { title: 'Original Title' });
    const updated = await repo.updateProject(project.id, testUserId, {
      title: 'Renamed Title',
      description: 'New Description',
    });

    expect(updated.title).toBe('Renamed Title');
    expect(updated.description).toBe('New Description');
  });

  it('should save and retrieve story, updating project status', async () => {
    const project = await repo.createProject(testUserId, { title: 'Story Test' });

    const storyDoc: StoryDocument = {
      title: 'Barnaby and the Golden Spatula',
      logline: 'A robot chef discovers a magic spatula.',
      premise: 'Cooking meets sorcery in a Parisian bistro.',
      beginning: 'Barnaby finds the spatula under a loose floorboard.',
      mainConflict: 'The spatula brings pastries to life.',
      turningPoints: ['The croissants organize a rebellion.'],
      climax: 'Barnaby bakes the ultimate peace brioche.',
      ending: 'Barnaby and pastries open a joint bakery.',
      characterDescriptions: [
        {
          name: 'Barnaby',
          role: 'Chef Bot',
          personality: 'Earnest and precise',
          appearance: 'Teal robot with an apron',
        },
      ],
      emotionalProgression: 'Curious -> Overwhelmed -> Victorious',
    };

    const savedStory = await repo.saveStory(project.id, testUserId, storyDoc);
    expect(savedStory.title).toBe(storyDoc.title);
    expect(savedStory.projectId).toBe(project.id);

    const retrieved = await repo.getStory(project.id, testUserId);
    expect(retrieved?.title).toBe(storyDoc.title);

    const projectDetails = await repo.getProject(project.id, testUserId);
    expect(projectDetails?.status).toBe('story_generated');
    expect(projectDetails?.hasStory).toBe(true);
  });

  it('should save and retrieve script, tracking revisions', async () => {
    const project = await repo.createProject(testUserId, { title: 'Script Test' });

    const scriptDoc: ScriptDocument = {
      title: 'Barnaby and the Golden Spatula',
      scenes: [
        {
          sceneNumber: 1,
          sceneHeading: 'INT. BISTRO KITCHEN - MORNING',
          narration: 'The morning started innocently.',
          dialogue: [{ characterName: 'Barnaby', line: 'Time to knead!' }],
          actionDescriptions: 'Barnaby rolls the golden dough.',
          approximateDurationSeconds: 10,
          estimatedWordCount: 8,
        },
      ],
      totalWordCount: 8,
      totalEstimatedDurationSeconds: 10,
      targetDurationSeconds: 30,
    };

    const firstSave = await repo.saveScript(project.id, testUserId, scriptDoc);
    expect(firstSave.revisionNumber).toBe(1);

    const secondSave = await repo.saveScript(project.id, testUserId, scriptDoc);
    expect(secondSave.revisionNumber).toBe(2);

    const retrieved = await repo.getScript(project.id, testUserId);
    expect(retrieved?.scenes.length).toBe(1);
  });

  it('should save, retrieve and patch structured scenes', async () => {
    const project = await repo.createProject(testUserId, { title: 'Scenes Test' });

    const scenes: StructuredScene[] = [
      {
        id: 'scene-1',
        sceneNumber: 1,
        sceneTitle: 'Opening Spark',
        sceneDescription: 'Flour dust settles in slow motion.',
        charactersInvolved: ['Barnaby'],
        characterActions: 'Barnaby wipes the brass surface.',
        dialogue: [],
        narration: 'Flour everywhere.',
        environmentDescription: 'Warm French bistro.',
        propsRequired: ['spatula', 'flour sack'],
        emotionalTone: 'calm',
        cameraDirectionSuggestions: 'Wide slow track in.',
        approximateDurationSeconds: 8,
        continuityNotes: 'Clean apron.',
      },
    ];

    await repo.saveScenes(project.id, testUserId, scenes);
    const retrieved = await repo.getScenes(project.id, testUserId);
    expect(retrieved.length).toBe(1);

    // Patch scene
    const updated = await repo.updateScene('scene-1', project.id, testUserId, {
      emotionalTone: 'anticipatory',
    });
    expect(updated.emotionalTone).toBe('anticipatory');
  });

  it('should duplicate a project including story, script, and scenes', async () => {
    const project = await repo.createProject(testUserId, { title: 'Master Project' });
    await repo.saveStory(project.id, testUserId, {
      title: 'Original Story',
      logline: 'Logline',
      premise: 'Premise',
      beginning: 'Beg',
      mainConflict: 'Con',
      turningPoints: ['TP'],
      climax: 'Cli',
      ending: 'End',
      characterDescriptions: [{ name: 'Hero', role: 'Main', personality: 'Bold', appearance: 'Tall' }],
      emotionalProgression: 'Arc',
    });

    const duplicated = await repo.duplicateProject(project.id, testUserId);
    expect(duplicated.title).toBe('Master Project (Copy)');
    expect(duplicated.id).not.toBe(project.id);

    const duplicatedDetails = await repo.getProject(duplicated.id, testUserId);
    expect(duplicatedDetails?.hasStory).toBe(true);
    expect(duplicatedDetails?.story?.title).toBe('Original Story');
  });

  it('should delete a project and clean up related assets', async () => {
    const project = await repo.createProject(testUserId, { title: 'To Delete' });
    const deleted = await repo.deleteProject(project.id, testUserId);
    expect(deleted).toBe(true);

    const fetched = await repo.getProject(project.id, testUserId);
    expect(fetched).toBeNull();
  });

  it('should record AI generation audit history', async () => {
    const record = await repo.recordAIGeneration({
      stage: 'story',
      provider: 'mock',
      model: 'deterministic-mock-v1',
      promptSnippet: 'Robot chef baking',
      latencyMs: 120,
      status: 'success',
      projectId: 'proj-123',
      userId: testUserId,
    });

    expect(record.id).toBeTruthy();
    const history = await repo.getAIGenerationRecords(testUserId);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]!.promptSnippet).toBe('Robot chef baking');
  });
});

