import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Waypoint, Find } from '@/types';

interface WaypointModalProps {
  waypoint: Waypoint;
  trackId: string;
  waypointIndex: number;
  onClose: () => void;
  onSaveFind: (trackId: string, waypointIndex: number, find: Find) => void;
  onDeleteFind: (trackId: string, waypointIndex: number, findId: string) => void;
}

const ERA_LABELS = {
  austro: 'Австро-Угорська',
  polish: 'Польська (міжвоєнна)',
  soviet: 'Радянська',
};

const MATERIAL_LABELS = {
  silver: 'Срібло',
  copper: 'Мідь',
  bronze: 'Бронза / Інше',
};

export default function WaypointModal({ waypoint, trackId, waypointIndex, onClose, onSaveFind, onDeleteFind }: WaypointModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState<'coin' | 'ring' | 'other'>('coin');
  const [coinEra, setCoinEra] = useState<'austro' | 'polish' | 'soviet'>('austro');
  const [coinMaterial, setCoinMaterial] = useState<'silver' | 'copper' | 'bronze'>('silver');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    const newFind: Find = {
      id: `find-${Date.now()}`,
      category,
      coinEra: category === 'coin' ? coinEra : undefined,
      coinMaterial: category === 'coin' ? coinMaterial : undefined,
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    onSaveFind(trackId, waypointIndex, newFind);
    setIsAdding(false);
    setDescription('');
  };

  const renderCoinImage = (era: string) => {
    let src = '';
    if (era === 'austro') src = '/assets/coins/coin_austro.png';
    else if (era === 'polish') src = '/assets/coins/coin_polish.png';
    else if (era === 'soviet') src = '/assets/coins/coin_soviet.png';

    if (!src) return null;
    return (
      <div className="w-full h-32 flex justify-center items-center bg-[#1C1917] rounded-lg border border-[#44403C] overflow-hidden my-4">
        <img src={src} alt={ERA_LABELS[era as keyof typeof ERA_LABELS]} className="h-full object-contain drop-shadow-md" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 bg-[#292524] border border-[#44403C] rounded-xl p-6 shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-xl font-semibold text-[#F5F0E8] font-[Playfair_Display]">
            Точка: {waypoint.name || 'Без назви'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A8A29E] hover:text-[#F5F0E8] hover:bg-[#44403C] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {waypoint.desc && (
            <p className="text-sm text-[#A8A29E] mb-6 p-3 bg-[#1C1917] rounded-lg border border-[#44403C]">
              {waypoint.desc}
            </p>
          )}

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-[#A8A29E] uppercase tracking-wider mb-3">Знахідки</h4>
            
            {!waypoint.finds || waypoint.finds.length === 0 ? (
              <p className="text-sm text-[#A8A29E] italic text-center py-4">Ще немає знахідок на цій точці.</p>
            ) : (
              <div className="space-y-3">
                {waypoint.finds.map((find) => (
                  <div key={find.id} className="p-3 bg-[#1C1917] rounded-lg border border-[#44403C] flex items-start gap-3">
                    <div className="w-12 h-12 shrink-0 bg-[#292524] rounded-full flex items-center justify-center border border-[#D4A843]/30 overflow-hidden">
                      {find.category === 'coin' && find.coinEra ? (
                        <img src={`/assets/coins/coin_${find.coinEra}.png`} className="w-full h-full object-cover" alt="coin" />
                      ) : find.category === 'ring' ? (
                        <span className="text-[#D4A843] text-xl">💍</span>
                      ) : (
                        <span className="text-[#A8A29E] text-xl">⛏️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h5 className="font-medium text-[#F5F0E8] text-sm">
                          {find.category === 'coin' ? 'Монета' : find.category === 'ring' ? 'Кільце' : 'Інше'}
                        </h5>
                        <button
                          onClick={() => onDeleteFind(trackId, waypointIndex, find.id)}
                          className="text-[#A8A29E] hover:text-red-400 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {find.category === 'coin' && (
                        <p className="text-xs text-[#D4A843] mt-0.5">
                          {ERA_LABELS[find.coinEra!]} • {MATERIAL_LABELS[find.coinMaterial!]}
                        </p>
                      )}
                      
                      {find.description && (
                        <p className="text-xs text-[#A8A29E] mt-1 line-clamp-2">{find.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isAdding ? (
            <div className="p-4 bg-[#1C1917] rounded-xl border border-[#D4A843]">
              <h4 className="font-medium text-[#F5F0E8] mb-4">Додати знахідку</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#A8A29E] mb-1">Що знайшли?</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#292524] border border-[#44403C] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] outline-none focus:border-[#D4A843]"
                  >
                    <option value="coin">Монета</option>
                    <option value="ring">Кільце</option>
                    <option value="other">Інше</option>
                  </select>
                </div>

                {category === 'coin' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-[#A8A29E] mb-1">Період</label>
                      <select
                        value={coinEra}
                        onChange={(e) => setCoinEra(e.target.value as any)}
                        className="w-full bg-[#292524] border border-[#44403C] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] outline-none focus:border-[#D4A843]"
                      >
                        <option value="austro">Австро-Угорська</option>
                        <option value="polish">Польська (міжвоєнна)</option>
                        <option value="soviet">Радянська</option>
                      </select>
                    </div>
                    
                    {renderCoinImage(coinEra)}

                    <div>
                      <label className="block text-xs font-medium text-[#A8A29E] mb-1">Матеріал</label>
                      <select
                        value={coinMaterial}
                        onChange={(e) => setCoinMaterial(e.target.value as any)}
                        className="w-full bg-[#292524] border border-[#44403C] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] outline-none focus:border-[#D4A843]"
                      >
                        <option value="silver">Срібло</option>
                        <option value="copper">Мідь</option>
                        <option value="bronze">Бронза / Інше</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#A8A29E] mb-1">Опис (необов'язково)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Наприклад: 5 копійок 1930 року"
                    className="w-full bg-[#292524] border border-[#44403C] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] outline-none focus:border-[#D4A843]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[#A8A29E] hover:bg-[#44403C] transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#D4A843] text-[#1C1917] hover:bg-[#C49A3B] transition-colors"
                  >
                    Зберегти
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 flex justify-center items-center gap-2 border-2 border-dashed border-[#44403C] rounded-xl text-[#A8A29E] hover:text-[#D4A843] hover:border-[#D4A843] hover:bg-[rgba(212,168,67,0.05)] transition-all font-medium"
            >
              <Plus size={18} />
              <span>Додати нову знахідку</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
