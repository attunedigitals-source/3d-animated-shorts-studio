import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../src/stores/useStudioStore';

describe('useStudioStore Unit Tests', () => {
  beforeEach(() => {
    // Reset store to known state
    useStudioStore.setState({
      activeView: 'dashboard',
      user: null,
      projects: [],
      currentProject: null,
      storyDraft: null,
      scriptDraft: null,
      scenesDraft: [],
      notification: null,
      storyPromptOptions: {
        topic: '',
        category: 'Comedy',
        targetDurationSeconds: 30,
        intendedAudience: 'General Audience',
        tone: 'Humorous and Whimsical',
        visualStyle: 'Stylized 3D Cartoon',
        language: 'English',
        customDirections: '',
      },
    });
  });

  it('should have initial dashboard view and empty current project', () => {
    const state = useStudioStore.getState();
    expect(state.activeView).toBe('dashboard');
    expect(state.currentProject).toBeNull();
    expect(state.storyPromptOptions.targetDurationSeconds).toBe(30);
  });

  it('should switch active views', () => {
    const { setActiveView } = useStudioStore.getState();
    setActiveView('story');
    expect(useStudioStore.getState().activeView).toBe('story');

    setActiveView('script');
    expect(useStudioStore.getState().activeView).toBe('script');
  });

  it('should update story prompt options', () => {
    const { setStoryPromptOptions } = useStudioStore.getState();
    setStoryPromptOptions({
      topic: 'Cyberpunk Squirrel',
      targetDurationSeconds: 60,
      tone: 'Thrilling and Fast-Paced',
    });

    const options = useStudioStore.getState().storyPromptOptions;
    expect(options.topic).toBe('Cyberpunk Squirrel');
    expect(options.targetDurationSeconds).toBe(60);
    expect(options.tone).toBe('Thrilling and Fast-Paced');
    expect(options.category).toBe('Comedy'); // unchanged default preserved
  });

  it('should update authentication user state', () => {
    const { setUser } = useStudioStore.getState();
    setUser({
      id: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Creator One',
    }, false);

    const state = useStudioStore.getState();
    expect(state.user?.id).toBe('test-user-123');
    expect(state.user?.displayName).toBe('Creator One');
    expect(state.isDevAuth).toBe(false);
  });

  it('should manage notification toast state', () => {
    const { setNotification } = useStudioStore.getState();
    setNotification({ type: 'success', message: 'Project saved!' });

    expect(useStudioStore.getState().notification?.message).toBe('Project saved!');
    expect(useStudioStore.getState().notification?.type).toBe('success');

    setNotification(null);
    expect(useStudioStore.getState().notification).toBeNull();
  });

  it('should manage scene drafts (add, update, delete)', () => {
    const { addScene, updateScene, deleteScene } = useStudioStore.getState();

    addScene();
    const scenes = useStudioStore.getState().scenesDraft;
    expect(scenes.length).toBe(1);
    const sceneId = scenes[0]!.id;

    updateScene(sceneId, {
      sceneTitle: 'Opening Shot',
      emotionalTone: 'Tense',
      cameraDirectionSuggestions: 'Extreme close up',
    });

    const updated = useStudioStore.getState().scenesDraft[0]!;
    expect(updated.sceneTitle).toBe('Opening Shot');
    expect(updated.emotionalTone).toBe('Tense');
    expect(updated.cameraDirectionSuggestions).toBe('Extreme close up');

    deleteScene(sceneId);
    expect(useStudioStore.getState().scenesDraft.length).toBe(0);
  });

  it('should update voice and supabase settings in state', () => {
    const { setVoiceSettings, setSupabaseSettings } = useStudioStore.getState();

    setVoiceSettings({
      provider: 'ai33',
      apiKey: 'test-ai33-key',
      defaultVoiceId: 'edge_en-US-GuyNeural',
    });

    const voice = useStudioStore.getState().voiceSettings;
    expect(voice.provider).toBe('ai33');
    expect(voice.apiKey).toBe('test-ai33-key');
    expect(voice.defaultVoiceId).toBe('edge_en-US-GuyNeural');

    setSupabaseSettings({
      mode: 'supabase',
      supabaseUrl: 'https://test-project.supabase.co',
      supabaseAnonKey: 'test-anon-key',
    });

    const db = useStudioStore.getState().supabaseSettings;
    expect(db.mode).toBe('supabase');
    expect(db.supabaseUrl).toBe('https://test-project.supabase.co');
    expect(db.supabaseAnonKey).toBe('test-anon-key');
  });
});

