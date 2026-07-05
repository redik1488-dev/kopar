import { useState, useRef } from 'react';
import { Image, Eye, EyeOff, Trash2, ChevronDown, ChevronRight, Upload, Plus, Minus } from 'lucide-react';
import type { ImageOverlay } from '@/types';

interface ImageListProps {
  images: ImageOverlay[];
  onAddImage: (file: File) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  activeImageId: string | null;
  onSelectImage: (id: string | null) => void;
  onScaleImage: (id: string, scale: number) => void;
}

export default function ImageList({ images, onAddImage, onToggleVisibility, onDelete, onUpdateOpacity, activeImageId, onSelectImage, onScaleImage }: ImageListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAddImage(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="border-t border-[#44403C]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-[rgba(68,64,60,0.3)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Image size={16} className="text-[#A8A29E]" />
          <span className="text-sm font-semibold text-[#F5F0E8]">Зображення</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A8A29E] bg-[#292524] px-2 py-0.5 rounded-full">{images.length}</span>
          {isExpanded ? <ChevronDown size={14} className="text-[#A8A29E]" /> : <ChevronRight size={14} className="text-[#A8A29E]" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 w-full px-3 py-2.5 mb-3 bg-[#292524] border border-dashed border-[#44403C] rounded-lg text-[#A8A29E] hover:text-[#F5F0E8] hover:border-[#D4A843] transition-colors"
          >
            <Upload size={16} />
            <span className="text-sm">Додати зображення</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {images.length === 0 ? (
            <div className="text-center py-4">
              <Image size={24} className="mx-auto mb-2 text-[#44403C]" />
              <p className="text-xs text-[#A8A29E]">Немає зображень</p>
            </div>
          ) : (
            <div className="space-y-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => onSelectImage(image.id === activeImageId ? null : image.id)}
                  className={`group px-3 py-2.5 bg-[rgba(41,37,36,0.5)] hover:bg-[rgba(68,64,60,0.4)] rounded-lg cursor-pointer transition-all ${activeImageId === image.id ? 'ring-1 ring-[#D4A843]' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleVisibility(image.id); }}
                      className="text-[#A8A29E] hover:text-[#F5F0E8] transition-colors"
                    >
                      {image.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <img src={image.dataUrl} alt={image.name} className="w-8 h-8 rounded object-cover border border-[#44403C]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#F5F0E8] truncate" title={image.name}>{image.name}</p>
                      <div className="text-xs text-[#A8A29E]">
                        {image.aspectRatio > 1 ? 'Пейзаж' : image.aspectRatio < 1 ? 'Портрет' : 'Квадрат'} · {Math.round(image.aspectRatio * 100) / 100}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
                      className="text-[#A8A29E] hover:text-[#EF4444] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Opacity slider */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-[#A8A29E] w-12">Прозор.</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(image.opacity * 100)}
                      onChange={(e) => onUpdateOpacity(image.id, parseInt(e.target.value) / 100)}
                      className="flex-1 h-1.5 bg-[#44403C] rounded-full appearance-none cursor-pointer accent-[#D4A843]"
                    />
                    <span className="text-xs text-[#F5F0E8] w-8 text-right">{Math.round(image.opacity * 100)}%</span>
                  </div>

                  {/* Save button and scale controls - only show for selected image */}
                  {activeImageId === image.id && (
                    <>
                      {/* Scale controls */}
                      <div className="flex items-center justify-between mb-2 mt-1">
                        <span className="text-[10px] text-[#A8A29E] uppercase tracking-wider">Розмір</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onScaleImage(image.id, 0.9); }}
                            className="px-2 py-1 bg-[#292524] border border-[#44403C] rounded hover:border-[#D4A843] hover:text-[#D4A843] text-[#A8A29E] transition-colors text-xs font-bold"
                            title="Зменшити"
                          >
                            <Minus size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onScaleImage(image.id, 1.1); }}
                            className="px-2 py-1 bg-[#292524] border border-[#44403C] rounded hover:border-[#D4A843] hover:text-[#D4A843] text-[#A8A29E] transition-colors text-xs font-bold"
                            title="Збільшити"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Save button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectImage(null); }}
                        className="w-full mt-1 px-3 py-1.5 bg-[#D4A843] text-[#1C1917] rounded hover:bg-[#c49a3b] transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <span>Зберегти позицію</span>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
