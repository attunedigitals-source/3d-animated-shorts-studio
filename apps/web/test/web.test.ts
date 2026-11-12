import { describe, it, expect } from 'vitest';
import { usePureStudioStore, GENERATION_STAGES } from '../src/stores/usePureStudioStore';

describe('Pure 3D Studio Web App', () => {
  it('initializes store with default viral topic and 8 generation stages', () => {
    const state = usePureStudioStore.getState();
    expect(state.topic).toContain('Napoleon');
    expect(state.aspectRatio).toBe('9:16');
    expect(GENERATION_STAGES.length).toBe(8);
    expect(GENERATION_STAGES[0]!.model).toContain('deep-research');
  });

  it('updates aspect ratio and topic smoothly', () => {
    const { setAspectRatio, setTopic } = usePureStudioStore.getState();
    setAspectRatio('16:9');
    setTopic('Voyager 1 Deep Space');

    const updated = usePureStudioStore.getState();
    expect(updated.aspectRatio).toBe('16:9');
    expect(updated.topic).toBe('Voyager 1 Deep Space');
  });
});

