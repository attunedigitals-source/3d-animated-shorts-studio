import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Pure3DStudioProject, RenderedShot } from '@studio/types';
import { KineticSubtitleOverlay } from './KineticSubtitleOverlay';

interface Pure3DTheaterProps {
  project: Pure3DStudioProject;
  onOpenSheetModal: () => void;
}

export const Pure3DTheater: React.FC<Pure3DTheaterProps> = ({
  project,
  onOpenSheetModal,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeShot, setActiveShot] = useState<RenderedShot | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const shots = project.shots || [];
  const narration = project.narration;
  const timestamps = narration?.timestamps || [];
  const character = project.characters[0];

  const totalDurationSeconds =
    narration?.durationSeconds ||
    shots.reduce((acc, s) => acc + (s.durationSeconds || 6), 0) ||
    60;
  const totalDurationMs = totalDurationSeconds * 1000;

  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      if (isPlaying) {
        const delta = now - lastTimestamp;
        setCurrentTimeMs((prev) => {
          const next = prev + delta;
          if (next >= totalDurationMs) {
            setIsPlaying(false);
            return totalDurationMs;
          }
          return next;
        });
      }
      lastTimestamp = now;
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, totalDurationMs]);

  useEffect(() => {
    if (shots.length === 0) return;

    let accum = 0;
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i]!;
      const durMs = (s.durationSeconds || 6) * 1000;
      if (currentTimeMs >= accum && (currentTimeMs < accum + durMs || i === shots.length - 1)) {
        setActiveShot(s);
        return;
      }
      accum += durMs;
    }
  }, [currentTimeMs, shots]);

  const togglePlay = () => {
    if (currentTimeMs >= totalDurationMs) {
      setCurrentTimeMs(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTimeMs(val);
  };

  const restart = () => {
    setCurrentTimeMs(0);
    setIsPlaying(true);
  };

  const downloadVideo = () => {
    if (activeShot?.imageUrl) {
      const a = document.createElement('a');
      a.href = activeShot.imageUrl;
      a.download = `${project.title.replace(/\s+/g, '_')}_shot_${activeShot.beatNumber}.png`;
      a.click();
    }
  };

  const motion = activeShot?.cameraTrajectory?.motion || 'push-in';
  const progressRatio = totalDurationMs > 0 ? (currentTimeMs % 6000) / 6000 : 0;
  let transformStyle = 'scale(1.0)';

  if (motion === 'push-in') {
    transformStyle = `scale(${1.0 + progressRatio * 0.12})`;
  } else if (motion === 'slow-pan-right') {
    transformStyle = `scale(1.08) translateX(${(progressRatio - 0.5) * 40}px)`;
  } else if (motion === 'slow-pan-left') {
    transformStyle = `scale(1.08) translateX(${(0.5 - progressRatio) * 40}px)`;
  } else if (motion === 'dramatic-tilt') {
    transformStyle = `scale(1.1) translateY(${(progressRatio - 0.5) * 30}px) rotate(${(progressRatio - 0.5) * 2}deg)`;
  }

  const is916 = project.aspectRatio === '9:16';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto space-y-4">
      <div
        ref={containerRef}
        className={`relative overflow-hidden bg-black rounded-3xl border-2 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-center transition-all ${
          is916 ? 'w-full max-w-[420px] aspect-[9/16]' : 'w-full aspect-[16/9]'
        }`}
      >
        {activeShot ? (
          <div
            className="w-full h-full relative transition-transform duration-200 ease-out"
            style={{ transform: transformStyle }}
          >
            <img
              src={activeShot.imageUrl}
              alt="3D CGI Scene"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="text-slate-500 text-sm">Rendering 3D Scene...</div>
        )}

        <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

        <KineticSubtitleOverlay
          timestamps={timestamps}
          currentTimeMs={currentTimeMs}
          fallbackText={
            project.beats.find((b) => b.beatNumber === activeShot?.beatNumber)?.text
          }
          aspectRatio={project.aspectRatio}
        />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-40">
          <button
            onClick={onOpenSheetModal}
            className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-400/50 text-xs font-semibold text-amber-300 hover:bg-slate-900 transition shadow-lg"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Character DNA: {character?.name || 'Locked'}</span>
          </button>

          <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono text-slate-300 border border-slate-700/60">
            Shot {activeShot?.beatNumber || 1} / {shots.length} • {activeShot?.cameraTrajectory?.shotType || 'close-up'}
          </div>
        </div>

        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute z-40 w-16 h-16 rounded-full bg-amber-500/90 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all transform hover:scale-105"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        )}
      </div>

      <div className="w-full max-w-[580px] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-12 text-right">
            {(currentTimeMs / 1000).toFixed(1)}s
          </span>
          <input
            type="range"
            min={0}
            max={totalDurationMs}
            value={currentTimeMs}
            onChange={handleSeek}
            className="flex-1 accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono text-slate-400 w-12">
            {totalDurationSeconds.toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-md font-bold"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={restart}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSheetModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Anchor Sheet
            </button>
            <button
              onClick={downloadVideo}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download 1080p
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

