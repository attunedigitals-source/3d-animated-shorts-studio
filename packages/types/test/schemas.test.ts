import { describe, it, expect } from 'vitest';
import {
  CharacterDNASchema,
  CanonicalCharacterSheetSchema,
  NarrativeBeatSchema,
  AudioNarrationSchema,
  Pure3DStudioProjectSchema,
} from '../src/index';

describe('Pure AI 3D Studio Schema Validation', () => {
  it('validates CharacterDNA with Locked Visual Matrix', () => {
    const character = {
      id: 'char_1',
      name: 'Napoleon Bonaparte',
      role: 'Emperor in retreat',
      visualIdentityMatrix: {
        promptTokens: '[CHAR_NAPOLEON_3D_DNA]',
        facialGeometry: 'Chiseled angular jawline, sharp piercing eyes',
        skinTone: 'Alabaster skin with frostbite redness',
        hairTexture: 'Wind-blown dark hair',
        wardrobe: 'Navy blue wool greatcoat with tarnished gold buttons and bicorne hat',
        renderingStyle: 'Unreal Engine 5 cinematic 3D CGI render, Pixar-style stylization, ray-traced subsurface scattering',
        colorPalette: ['#1A2B4C', '#D4AF37', '#8B0000'],
      },
    };

    const parsed = CharacterDNASchema.parse(character);
    expect(parsed.name).toBe('Napoleon Bonaparte');
    expect(parsed.visualIdentityMatrix.promptTokens).toBe('[CHAR_NAPOLEON_3D_DNA]');
  });

  it('validates CanonicalCharacterSheet', () => {
    const sheet = {
      characterId: 'char_1',
      characterName: 'Napoleon Bonaparte',
      sheetImageUrl: 'https://cdn.studio.test/sheet_1.png',
      createdAt: new Date().toISOString(),
    };

    const parsed = CanonicalCharacterSheetSchema.parse(sheet);
    expect(parsed.characterName).toBe('Napoleon Bonaparte');
  });

  it('validates NarrativeBeat with Camera Trajectory', () => {
    const beat = {
      beatNumber: 1,
      type: 'Hook',
      text: 'Five hundred thousand men marched into the blizzard.',
      visualSceneDescription: 'Smoking ruins of Moscow under iron sky',
      action: 'Turns towards the frozen horizon',
      cameraTrajectory: {
        shotType: 'close-up',
        motion: 'push-in',
        focalLength: '35mm anamorphic',
        lighting: 'Volumetric blizzard rim light',
      },
      targetDurationSeconds: 6,
    };

    const parsed = NarrativeBeatSchema.parse(beat);
    expect(parsed.type).toBe('Hook');
    expect(parsed.cameraTrajectory.motion).toBe('push-in');
  });

  it('validates AudioNarration with Word Timestamps', () => {
    const narration = {
      audioUrl: 'https://cdn.studio.test/voice.mp3',
      durationSeconds: 5.5,
      timestamps: [
        { word: 'Five', startMs: 0, endMs: 250 },
        { word: 'hundred', startMs: 250, endMs: 600 },
      ],
      voiceModel: 'ai33-neural-hd',
    };

    const parsed = AudioNarrationSchema.parse(narration);
    expect(parsed.timestamps.length).toBe(2);
  });

  it('validates Pure3DStudioProject', () => {
    const project = {
      id: 'proj_1',
      title: 'Napoleon Winter 1812',
      topic: 'Napoleon retreat 1812',
      aspectRatio: '9:16',
      targetDurationSeconds: 60,
      characters: [
        {
          id: 'char_1',
          name: 'Napoleon',
          role: 'Emperor',
          visualIdentityMatrix: {
            promptTokens: '[CHAR_DNA]',
            facialGeometry: 'Square jaw',
            skinTone: 'Fair',
            hairTexture: 'Short',
            wardrobe: 'Greatcoat',
            renderingStyle: 'Pixar/UE5',
            colorPalette: ['#000', '#fff'],
          },
        },
      ],
      canonicalSheets: [
        {
          characterId: 'char_1',
          characterName: 'Napoleon',
          sheetImageUrl: 'https://cdn.studio.test/sheet.png',
          createdAt: new Date().toISOString(),
        },
      ],
      beats: [
        {
          beatNumber: 1,
          type: 'Hook',
          text: 'The frost began.',
          visualSceneDescription: 'Snow falling',
          action: 'Stares at snow',
          cameraTrajectory: {
            shotType: 'close-up',
            motion: 'push-in',
            focalLength: '35mm',
            lighting: 'Rim light',
          },
          targetDurationSeconds: 5,
        },
      ],
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parsed = Pure3DStudioProjectSchema.parse(project);
    expect(parsed.id).toBe('proj_1');
    expect(parsed.status).toBe('completed');
  });
});
