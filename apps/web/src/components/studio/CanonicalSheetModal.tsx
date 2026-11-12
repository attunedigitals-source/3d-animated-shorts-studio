import React from 'react';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';
import { CanonicalCharacterSheet, CharacterDNA } from '@studio/types';

interface CanonicalSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: CanonicalCharacterSheet | null;
  character: CharacterDNA | null;
}

export const CanonicalSheetModal: React.FC<CanonicalSheetModalProps> = ({
  isOpen,
  onClose,
  sheet,
  character,
}) => {
  if (!isOpen || !sheet || !character) return null;

  const dna = character.visualIdentityMatrix;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Canonical 3D Character Anchor Sheet
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  100% Character Lock
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generated via Nano Banana Pro (gemini-3-pro-image) • Conditioned across all scenes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 font-medium">Locked Visual DNA Token:</span>
              <div className="font-mono text-sm text-amber-400 font-bold">{dna.promptTokens}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Color Palette:</span>
              <div className="flex items-center gap-1.5">
                {dna.colorPalette.map((color, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Multimodal Invariance Active
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950 flex justify-center items-center">
            <img
              src={sheet.sheetImageUrl}
              alt="Canonical Character Anchor Sheet"
              className="w-full h-auto object-contain max-h-[580px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <div className="text-slate-400 font-semibold mb-1">Facial Geometry & Skin</div>
              <div className="text-slate-200">{dna.facialGeometry}</div>
              <div className="mt-1 text-slate-400 italic">{dna.skinTone}</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <div className="text-slate-400 font-semibold mb-1">Wardrobe & Fabrics</div>
              <div className="text-slate-200">{dna.wardrobe}</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <div className="text-slate-400 font-semibold mb-1">Rendering Style</div>
              <div className="text-slate-200">{dna.renderingStyle}</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition"
          >
            Close Sheet Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

