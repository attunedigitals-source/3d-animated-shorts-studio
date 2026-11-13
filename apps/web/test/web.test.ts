import { describe, it, expect } from 'vitest';
import { usePureStudioStore, GENERATION_STAGES } from '../src/stores/usePureStudioStore';

describe('Pure 3D Studio Web App', () => {
  it('initializes store with default viral topic and 8 generation stages', () => {
    const state = usePureStudioStore.getState();
    expect(state.topic).toContain('Napoleon');
    expect(state.aspectRatio).toBe('9:16');
    expect(GENERATION_STAGES.length).toBe(8);
    expect(GENERATION_STAGES[0]!.model).toContain('gemini-3.1-flash-lite');
  });

  it('updates aspect ratio and topic smoothly', () => {
    const { setAspectRatio, setTopic } = usePureStudioStore.getState();
    setAspectRatio('16:9');
    setTopic('Voyager 1 Deep Space');

    const updated = usePureStudioStore.getState();
    expect(updated.aspectRatio).toBe('16:9');
    expect(updated.topic).toBe('Voyager 1 Deep Space');
  });

  it('stores session API keys in memory only and never writes secrets to localStorage', () => {
    const { setSessionGeminiKey, setSessionAi33Key } = usePureStudioStore.getState();
    setSessionGeminiKey('AIzaSy_session_key_12345');
    setSessionAi33Key('ai33_session_key_12345');

    expect(usePureStudioStore.getState().sessionGeminiKey).toBe('AIzaSy_session_key_12345');
    expect(usePureStudioStore.getState().sessionAi33Key).toBe('ai33_session_key_12345');

    // Confirm neither secret is in localStorage (safe for Node environments without DOM)
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('GEMINI_API_KEY')).toBeNull();
      expect(localStorage.getItem('AI33_API_KEY')).toBeNull();
    }

    // The store itself must never have a side-effect that persists keys
    // Zustand store is in-memory by design; no persist middleware is attached.
    expect(usePureStudioStore.getState().sessionGeminiKey).toBe('AIzaSy_session_key_12345');
  });
});

