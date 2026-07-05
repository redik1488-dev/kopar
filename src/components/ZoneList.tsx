import { useState } from 'react';
import { Eye, EyeOff, Trash2, ChevronDown, ChevronRight, SquareDashed, Palette } from 'lucide-react';
import type { Zone } from '@/types';

interface ZoneListProps {
  zones: Zone[];
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateColor: (id: string, color: string) => void;
}

const zoneColors = [
  { name: 'Золотий', value: '#D4A843' },
  { name: 'Зелений', value: '#4A6741' },
  { name: 'Червоний', value: '#DC2626' },
  { name: 'Синій', value: '#2563EB' },
  { name: 'Фіолетовий', value: '#7C3AED' },
  { name: 'Помаранчевий', value: '#EA580C' },
];

export default function ZoneList({ zones, onToggleVisibility, onDelete, onUpdateName, onUpdateColor }: ZoneListProps) {
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (zone: Zone) => {
    setEditingId(zone.id);
    setEditName(zone.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdateName(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="border-b border-[#44403C]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-[rgba(255,255,255,0.03)] transition-colors"
      >
        {expanded ? <ChevronDown size={16} className="text-[#A8A29E]" /> : <ChevronRight size={16} className="text-[#A8A29E]" />}
        <SquareDashed size={16} className="text-[#4A6741]" />
        <span className="text-sm font-semibold text-[#F5F0E8]">Зони</span>
        <span className="ml-auto text-xs text-[#A8A29E] bg-[#1C1917] px-2 py-0.5 rounded-full">{zones.length}</span>
      </button>

      {expanded && (
        <div className="px-2 pb-2">
          {zones.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <SquareDashed size={24} className="mx-auto mb-2 text-[#44403C]" />
              <p className="text-xs text-[#A8A29E]">Немає створених зон</p>
            </div>
          ) : (
            zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: zone.visible ? zone.color : '#44403C' }}
                />
                <div className="flex-1 min-w-0">
                  {editingId === zone.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full text-sm font-medium bg-[#1C1917] border border-[#D4A843] rounded px-2 py-0.5 text-[#F5F0E8] outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(zone)}
                      className={`text-sm font-medium text-left truncate w-full hover:text-[#D4A843] transition-colors ${
                        zone.visible ? 'text-[#F5F0E8]' : 'text-[#A8A29E]'
                      }`}
                    >
                      {zone.name}
                    </button>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                    <span>{zone.area.toFixed(2)} га</span>
                    <div className="relative">
                      <Palette size={12} className="cursor-pointer hover:text-[#D4A843] transition-colors" />
                      <select
                        value={zone.color}
                        onChange={(e) => onUpdateColor(zone.id, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      >
                        {zoneColors.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onToggleVisibility(zone.id)}
                  className="p-1.5 text-[#A8A29E] hover:text-[#F5F0E8] hover:bg-[#44403C] rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title={zone.visible ? 'Приховати' : 'Показати'}
                >
                  {zone.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => onDelete(zone.id)}
                  className="p-1.5 text-[#A8A29E] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Видалити"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
