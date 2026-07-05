import { useState } from 'react';
import { Eye, EyeOff, Trash2, ChevronDown, ChevronRight, FileText, Route } from 'lucide-react';
import type { GpxTrack } from '@/types';

interface TrackListProps {
  tracks: GpxTrack[];
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
}

const COLOR_PALETTE = ['#D4A843', '#EF4444', '#3B82F6', '#22C55E', '#A855F7', '#F97316', '#EC4899', '#06B6D4'];

export default function TrackList({ tracks, onToggleVisibility, onDelete, onUpdateColor, onUpdateWeight }: TrackListProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b border-[#44403C]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-[rgba(255,255,255,0.03)] transition-colors"
      >
        {expanded ? <ChevronDown size={16} className="text-[#A8A29E]" /> : <ChevronRight size={16} className="text-[#A8A29E]" />}
        <Route size={16} className="text-[#D4A843]" />
        <span className="text-sm font-semibold text-[#F5F0E8]">Треки</span>
        <span className="ml-auto text-xs text-[#A8A29E] bg-[#1C1917] px-2 py-0.5 rounded-full">{tracks.length}</span>
      </button>

      {expanded && (
        <div className="px-2 pb-2">
          {tracks.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <FileText size={24} className="mx-auto mb-2 text-[#44403C]" />
              <p className="text-xs text-[#A8A29E]">Немає імпортованих треків</p>
            </div>
          ) : (
            tracks.map((track) => (
              <div
                key={track.id}
                className="px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: track.visible ? track.color : '#44403C' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${track.visible ? 'text-[#F5F0E8]' : 'text-[#A8A29E]'}`}>
                      {track.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                      <span>{track.distance.toFixed(2)} км</span>
                      <span>·</span>
                      <span>{track.pointCount} точок</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleVisibility(track.id)}
                    className="p-1.5 text-[#A8A29E] hover:text-[#F5F0E8] hover:bg-[#44403C] rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title={track.visible ? 'Приховати' : 'Показати'}
                  >
                    {track.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => onDelete(track.id)}
                    className="p-1.5 text-[#A8A29E] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Видалити"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 flex-1">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        onClick={() => onUpdateColor(track.id, color)}
                        className="w-3 h-3 rounded-full border border-white/10 hover:scale-125 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#A8A29E] uppercase font-semibold">Товщина:</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={track.weight || 3}
                      onChange={(e) => onUpdateWeight(track.id, parseInt(e.target.value))}
                      className="w-16 accent-[#D4A843]"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
