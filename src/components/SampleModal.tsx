import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../engine/samples';

interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleImage) => void;
}

export const SampleModal: React.FC<SampleModalProps> = ({ isOpen, onClose, onSelectSample }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#10131a] border border-zinc-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#0b0c10]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-zinc-100">Sample Test Images</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {SAMPLE_IMAGES.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-indigo-500/80 hover:bg-zinc-800/60 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h4 className="font-medium text-xs text-zinc-200 group-hover:text-indigo-300 transition-colors">
                  {sample.name}
                </h4>
                <p className="text-[11px] text-zinc-500">{sample.category}</p>
              </div>
              <button className="px-2.5 py-1 rounded text-[11px] bg-zinc-800 group-hover:bg-indigo-600 text-zinc-300 group-hover:text-white transition-colors">
                Load
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
