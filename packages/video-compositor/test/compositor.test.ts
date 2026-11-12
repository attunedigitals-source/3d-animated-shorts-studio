import { describe, it, expect } from 'vitest';
import { Pure3DComposition } from '../src/Pure3DComposition';

describe('Video Compositor Module', () => {
  it('exports Pure3DComposition component function', () => {
    expect(Pure3DComposition).toBeDefined();
    expect(typeof Pure3DComposition).toBe('function');
  });
});

