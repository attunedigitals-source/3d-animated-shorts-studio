import React from 'react';
import { WordTimestamp } from '@studio/types';

interface KineticSubtitleOverlayProps {
  timestamps: WordTimestamp[];
  currentTimeMs: number;
  fallbackText?: string;
  aspectRatio: '9:16' | '16:9';
}

export const KineticSubtitleOverlay: React.FC<KineticSubtitleOverlayProps> = ({
  timestamps,
  currentTimeMs,
  fallbackText = '',
  aspectRatio,
}) => {
  let activeWordIndex = -1;
  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i]!;
    if (currentTimeMs >= t.startMs && currentTimeMs <= t.endMs) {
      activeWordIndex = i;
      break;
    }
  }

  let displayTokens: { word: string; isActive: boolean; key: number }[] = [];

  if (activeWordIndex !== -1) {
    const windowStart = Math.max(0, activeWordIndex - 2);
    const windowEnd = Math.min(timestamps.length, activeWordIndex + 3);

    displayTokens = timestamps.slice(windowStart, windowEnd).map((t, idx) => ({
      word: t.word,
      isActive: windowStart + idx === activeWordIndex,
      key: windowStart + idx,
    }));
  } else if (fallbackText) {
    displayTokens = fallbackText.split(/\s+/).slice(0, 6).map((w, idx) => ({
      word: w,
      isActive: false,
      key: idx,
    }));
  }

  if (displayTokens.length === 0) return null;

  return (
    <div
      className={`absolute left-0 right-0 z-40 flex justify-center px-4 pointer-events-none transition-all duration-150 ${
        aspectRatio === '9:16' ? 'bottom-20' : 'bottom-12'
      }`}
    >
      <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-amber-400/50 shadow-2xl flex flex-wrap justify-center items-center gap-2 max-w-[90%]">
        {displayTokens.map((item) => (
          <span
            key={item.key}
            className={`font-black uppercase tracking-wider transition-all duration-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
              aspectRatio === '9:16' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
            } ${
              item.isActive
                ? 'text-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]'
                : 'text-white scale-100'
            }`}
          >
            {item.word}
          </span>
        ))}
      </div>
    </div>
  );
};

