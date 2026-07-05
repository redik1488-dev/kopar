import { useState } from 'react';
import { Eye, EyeOff, Trash2, ChevronDown, ChevronRight, Minus, Download } from 'lucide-react';
import type { MapLine } from '@/types';

interface LineListProps {
  lines: MapLine[];
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
}

const lineColors = [
  { name: 'Золотий', value: '#D4A843' },
  { name: 'Зелений', value: '#4A6741' },
  { name: 'Червоний', value: '#DC2626' },
  { name: 'Синій', value: '#2563EB' },
  { name: 'Фіолетовий', value: '#7C3AED' },
  { name: 'Помаранчевий', value: '#EA580C' },
];

export default function LineList({ lines, onToggleVisibility, onDelete, onUpdateName, onUpdateColor, onUpdateWeight }: LineListProps) {
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (line: MapLine) => {
    setEditingId(line.id);
    setEditName(line.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdateName(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const exportToGpx = (line: MapLine) => {
    let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
    gpx += '<gpx version="1.1" creator="Kopar" xmlns="http://www.topografix.com/GPX/1/1">\n';
    gpx += '  <trk>\n';
    gpx += `    <name>${line.name}</name>\n`;
    gpx += '    <trkseg>\n';
    line.points.forEach((pt) => {
      gpx += `      <trkpt lat="${pt.lat}" lon="${pt.lng}"></trkpt>\n`;
    });
    gpx += '    </trkseg>\n';
    gpx += '  </trk>\n';
    gpx += '</gpx>';

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${line.name || 'line'}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-b border-[#44403C]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-[rgba(255,255,255,0.03)] transition-colors"
      >
        {expanded ? <ChevronDown size={16} className="text-[#A8A29E]" /> : <ChevronRight size={16} className="text-[#A8A29E]" />}
        <Minus size={16} className="text-[#4A6741]" />
        <span className="text-sm font-semibold text-[#F5F0E8]">Лінії</span>
        <span className="ml-auto text-xs text-[#A8A29E] bg-[#1C1917] px-2 py-0.5 rounded-full">{lines.length}</span>
      </button>

      {expanded && (
        <div className="px-2 pb-2">
          {lines.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <Minus size={24} className="mx-auto mb-2 text-[#44403C]" />
              <p className="text-xs text-[#A8A29E]">Немає створених ліній</p>
            </div>
          ) : (
            lines.map((line) => (
              <div
                key={line.id}
                className="flex flex-col px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: line.visible ? line.color : '#44403C' }}
                  />
                  <div className="flex-1 min-w-0">
                    {editingId === line.id ? (
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
                        onClick={() => startEdit(line)}
                        className={`text-sm font-medium text-left truncate w-full hover:text-[#D4A843] transition-colors ${
                          line.visible ? 'text-[#F5F0E8]' : 'text-[#A8A29E]'
                        }`}
                      >
                        {line.name}
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                      <span>{line.length.toFixed(2)} км</span>
                    </div>
                  </div>
                  <button
                    onClick={() => exportToGpx(line)}
                    className="p-1.5 text-[#A8A29E] hover:text-[#D4A843] hover:bg-[#D4A843]/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Експорт в GPX"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => onToggleVisibility(line.id)}
                    className="p-1.5 text-[#A8A29E] hover:text-[#F5F0E8] hover:bg-[#44403C] rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title={line.visible ? 'Приховати' : 'Показати'}
                  >
                    {line.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => onDelete(line.id)}
                    className="p-1.5 text-[#A8A29E] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Видалити"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 flex-1">
                    {lineColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => onUpdateColor(line.id, c.value)}
                        className="w-3 h-3 rounded-full border border-white/10 hover:scale-125 transition-transform"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#A8A29E] uppercase font-semibold">Товщина:</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={line.weight || 3}
                      onChange={(e) => onUpdateWeight(line.id, parseInt(e.target.value))}
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
