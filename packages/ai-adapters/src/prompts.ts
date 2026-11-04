import { StoryPromptOptions, StoryDocument, ScriptDocument } from '@studio/types';

export function buildStoryPrompt(options: StoryPromptOptions): { system: string; user: string } {
  const system = `You are a master animation director and lead screenwriter specializing in high-engagement 3D animated shorts, YouTube Shorts, and cartoon narratives.
You create original, vivid, emotionally resonant stories with distinct cartoon characters, clear setups, punchy conflicts, and satisfying climaxes.
You MUST output strictly valid JSON conforming exactly to the requested schema. Do not include introductory conversational text or concluding remarks.`;

  const user = `Generate an original 3D animated cartoon short story based on these specifications:
- Concept / Idea: "${options.topic}"
- Preferred Title: "${options.title || 'Untitled Animation'}"
- Genre / Category: "${options.category}"
- Target Duration: ${options.targetDurationSeconds} seconds
- Target Audience: "${options.intendedAudience}"
- Tone: "${options.tone}"
- Visual Style: "${options.visualStyle}"
- Language: "${options.language}"
${options.additionalInstructions ? `- Additional Creative Instructions: "${options.additionalInstructions}"` : ''}

You must return a JSON object with this EXACT structure:
{
  "title": "A catchy, creative title",
  "logline": "A punchy 1-2 sentence hook describing protagonist, conflict, and stakes",
  "premise": "The core animated premise and world setup",
  "beginning": "The opening scene establishing normal world and inciting incident",
  "mainConflict": "The primary obstacle, comedic clash, or physical comedy challenge",
  "turningPoints": ["Turning point 1: escalation", "Turning point 2: complication"],
  "climax": "The peak comedic or dramatic confrontation",
  "ending": "The punchline, humorous resolution, or satisfying button",
  "characterDescriptions": [
    {
      "name": "Character Name",
      "role": "Protagonist / Foil / Antagonist",
      "personality": "Exaggerated cartoon personality traits",
      "appearance": "Stylized 3D cartoon physical traits (shapes, proportions, colors)",
      "visualDistinctives": "Signature prop, hat, or animated feature"
    }
  ],
  "emotionalProgression": "The emotional arc from start to finish (e.g. Confident -> Frustrated -> Panicked -> Triumphant)"
}`;

  return { system, user };
}

export function buildScriptPrompt(story: StoryDocument, targetDurationSeconds: number): { system: string; user: string } {
  const system = `You are an elite animated scriptwriter specializing in fast-paced 3D animated shorts.
You write tight, visual scripts with punchy character dialogue, snappy narration, and vivid cartoon action cues.
You MUST output strictly valid JSON conforming exactly to the requested schema.`;

  // Standard short narration pacing is ~2.5 words per second (150 WPM)
  const estimatedTargetWords = Math.round(targetDurationSeconds * 2.5);
  const estimatedScenes = Math.max(3, Math.min(8, Math.round(targetDurationSeconds / 6)));

  const user = `Convert the following approved story into a narration-ready 3D animated video script.
Target Duration: ${targetDurationSeconds} seconds (~${estimatedTargetWords} spoken words across ~${estimatedScenes} scenes).

STORY DETAILS:
- Title: ${story.title}
- Logline: ${story.logline}
- Premise: ${story.premise}
- Beginning: ${story.beginning}
- Conflict: ${story.mainConflict}
- Turning Points: ${story.turningPoints.join('; ')}
- Climax: ${story.climax}
- Ending: ${story.ending}
- Characters: ${story.characterDescriptions.map((c) => `${c.name} (${c.role}): ${c.personality}`).join(' | ')}
- Emotional Arc: ${story.emotionalProgression}

You must output a JSON object with this EXACT structure:
{
  "title": "${story.title}",
  "totalWordCount": 75,
  "totalEstimatedDurationSeconds": ${targetDurationSeconds},
  "targetDurationSeconds": ${targetDurationSeconds},
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneHeading": "INT. KITCHEN - DAY",
      "narration": "Voiceover narration line for this scene (if any)",
      "dialogue": [
        {
          "characterName": "Name",
          "line": "Actual dialogue spoken",
          "deliveryInstruction": "whispering / excited / screaming"
        }
      ],
      "actionDescriptions": "Clear, dynamic visual cartoon actions for the 3D animators",
      "emotionalDirection": "Frantic slapstick / nervous anticipation",
      "approximateDurationSeconds": 5,
      "estimatedWordCount": 15
    }
  ]
}`;

  return { system, user };
}

export function buildSceneBreakdownPrompt(script: ScriptDocument, story?: StoryDocument): { system: string; user: string } {
  const system = `You are a 3D Animation Technical Director and Layout Supervisor.
You convert animation scripts into production-ready structured scenes for 3D environments, camera staging, and character rigging.
You MUST output strictly valid JSON conforming exactly to the requested schema.`;

  const user = `Break down this animated script into structured 3D production scenes.
Script Title: "${script.title}"
Total Scenes: ${script.scenes.length}
Target Duration: ${script.targetDurationSeconds} seconds

SCRIPT CONTENT:
${JSON.stringify(script.scenes, null, 2)}

${story ? `CHARACTERS:\n${JSON.stringify(story.characterDescriptions, null, 2)}` : ''}

You must output a JSON array of structured scenes with this EXACT schema for EACH scene:
[
  {
    "id": "scene-1",
    "sceneNumber": 1,
    "sceneTitle": "Opening Setup",
    "sceneDescription": "Detailed narrative description of what occurs in the scene",
    "charactersInvolved": ["CharacterName1", "CharacterName2"],
    "characterActions": "Explicit physical animation movements (e.g. trips over cord, slides into wall)",
    "dialogue": [
      {
        "characterName": "CharacterName",
        "line": "Spoken line",
        "emotion": "surprised"
      }
    ],
    "narration": "Spoken voiceover narration for this scene",
    "environmentDescription": "3D setting details (e.g. Modern stylized kitchen with oversized pastel toaster, checkered floor, warm morning sunlight)",
    "propsRequired": ["rolling pin", "flour sack", "clock"],
    "emotionalTone": "comedic chaos",
    "cameraDirectionSuggestions": "Low angle tracking shot following rolling pin, Dutch tilt on reaction",
    "approximateDurationSeconds": 5,
    "continuityNotes": "Flour smudge remains on protagonist's left cheek into scene 2"
  }
]`;

  return { system, user };
}

