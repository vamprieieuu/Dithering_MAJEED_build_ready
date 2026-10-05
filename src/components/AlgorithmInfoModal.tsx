import React, { useState } from 'react';
import { X, BookOpen, Search, Info } from 'lucide-react';
import { ALGORITHMS } from '../engine/ditherEngine';
import { DitherCategory } from '../types/dither';

interface AlgorithmInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlgo: (id: number) => void;
}

export const AlgorithmInfoModal: React.FC<AlgorithmInfoModalProps> = ({
  isOpen,
  onClose,
  onSelectAlgo,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const categories = ['ALL', ...Array.from(new Set(ALGORITHMS.map((a) => a.category)))];

  const filteredAlgos = ALGORITHMS.filter((algo) => {
    const matchesCat = selectedCategory === 'ALL' || algo.category === selectedCategory;
    const matchesSearch =
      algo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      algo.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      algo.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none font-mono">
      <div className="w-full max-w-2xl bg-[#12151c] border border-[#252c3c] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#161a22] border-b border-[#252c3c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-white tracking-wide">
              ALGORITHM ENCYCLOPEDIA (49 ALGORITHMS)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#202636] text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-[#141820] border-b border-[#212630] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search algorithm or technique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1b202c] border border-[#2c3444] rounded py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-black'
                    : 'bg-[#1b202c] text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredAlgos.map((algo) => (
            <div
              key={algo.id}
              className="p-3 rounded bg-[#161a22] border border-[#252c3c] hover:border-cyan-500/50 transition flex items-start justify-between gap-4 group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                    #{algo.id + 1} {algo.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1e2432] text-[9px] text-cyan-400 font-mono border border-cyan-500/20">
                    {algo.category}
                  </span>
                  <span className="text-[10px] text-zinc-400 uppercase font-mono">
                    [{algo.kind}]
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  {algo.desc}
                </p>
                {algo.cell && (
                  <div className="flex gap-3 text-[10px] text-zinc-400 mt-1.5">
                    <span>Default Period: {algo.cell}px</span>
                    <span>Screen Angle: {algo.angle}°</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onSelectAlgo(algo.id);
                  onClose();
                }}
                className="py-1 px-2.5 rounded bg-[#202738] group-hover:bg-cyan-500 group-hover:text-black text-zinc-300 text-xs font-bold transition whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          ))}

          {filteredAlgos.length === 0 && (
            <div className="text-center py-8 text-zinc-400 text-xs">
              No matching algorithms found for "{searchTerm}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
