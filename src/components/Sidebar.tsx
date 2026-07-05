import { useState, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeft, Route, SquareDashed, Minus, Image } from 'lucide-react';
import TrackList from './TrackList';
import ZoneList from './ZoneList';
import LineList from './LineList';
import ImageList from './ImageList';
import type { GpxTrack, Zone, MapLine, ImageOverlay } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tracks: GpxTrack[];
  zones: Zone[];
  lines: MapLine[];
  images: ImageOverlay[];
  onToggleTrack: (id: string) => void;
  onDeleteTrack: (id: string) => void;
  onToggleZone: (id: string) => void;
  onDeleteZone: (id: string) => void;
  onUpdateZoneName: (id: string, name: string) => void;
  onUpdateZoneColor: (id: string, color: string) => void;
  onUpdateTrackColor: (id: string, color: string) => void;
  onUpdateTrackWeight: (id: string, weight: number) => void;
  onToggleLine: (id: string) => void;
  onDeleteLine: (id: string) => void;
  onUpdateLineName: (id: string, name: string) => void;
  onUpdateLineColor: (id: string, color: string) => void;
  onUpdateLineWeight: (id: string, weight: number) => void;
  onAddImage: (file: File) => void;
  onToggleImage: (id: string) => void;
  onDeleteImage: (id: string) => void;
  onUpdateImageOpacity: (id: string, opacity: number) => void;
  onScaleImage: (id: string, scale: number) => void;
  drawPoints: [number, number][];
  drawColor: string;
  onSetDrawColor: (color: string) => void;
  onFinish: () => void;
  onCancel: () => void;
  drawModeType: 'zone' | 'line' | 'measure' | null;
  activeImageId: string | null;
  onSelectImage: (id: string | null) => void;
}

const drawColors = [
  '#4A6741',
  '#D4A843',
  '#EF4444',
  '#3B82F6',
  '#22C55E',
  '#A855F7',
  '#F97316',
  '#EC4899',
];

export default function Sidebar({
  isOpen,
  onToggle,
  tracks,
  zones,
  lines,
  images,
  onToggleTrack,
  onDeleteTrack,
  onToggleZone,
  onDeleteZone,
  onUpdateZoneName,
  onUpdateZoneColor,
  onUpdateTrackColor,
  onUpdateTrackWeight,
  onToggleLine,
  onDeleteLine,
  onUpdateLineName,
  onUpdateLineColor,
  onUpdateLineWeight,
  onAddImage,
  onToggleImage,
  onDeleteImage,
  onUpdateImageOpacity,
  onScaleImage,
  drawPoints,
  drawColor,
  onSetDrawColor,
  onFinish,
  onCancel,
  drawModeType,
  activeImageId,
  onSelectImage,
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isDrawing = drawPoints.length > 0;

  // Calculate distance for measure/line modes
  const calculateDistance = () => {
    if (drawPoints.length < 2) return 0;
    let dist = 0;
    const R = 6371; // km
    for (let i = 1; i < drawPoints.length; i++) {
      const p1 = drawPoints[i - 1];
      const p2 = drawPoints[i];
      const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
      const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1[0] * Math.PI) / 180) *
          Math.cos((p2[0] * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      dist += R * c;
    }
    return dist;
  };
  
  const distance = calculateDistance();

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[998]"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-[56px] left-0 bottom-0 bg-[#1C1917] border-r border-[#44403C] z-[999] flex flex-col transition-transform duration-300 ease-out ${
          isMobile ? 'w-full' : 'w-[320px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#44403C]">
          <h2 className="text-base font-semibold text-[#F5F0E8] font-[Playfair_Display]">Панель</h2>
          <button
            onClick={onToggle}
            className="p-1.5 text-[#A8A29E] hover:text-[#F5F0E8] hover:bg-[#44403C] rounded-lg transition-colors"
          >
            {isOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Drawing Controls */}
          {isDrawing && (
            <div className="m-3 p-3 rounded-xl bg-[rgba(212,168,67,0.08)] border border-[rgba(212,168,67,0.25)]">
              <h3 className="text-sm font-semibold text-[#D4A843] mb-2">
                {drawModeType === 'zone' ? 'Нова зона' : drawModeType === 'measure' ? 'Вимірювання' : 'Нова лінія'}
              </h3>

              {/* Color palette */}
              <div className="flex items-center gap-2 mb-2">
                {drawColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onSetDrawColor(color)}
                    className={`w-[14px] h-[14px] rounded-full transition-transform active:scale-90 ${
                      drawColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1C1917]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              {/* Point counter */}
              <div className="text-xs text-[#A8A29E] mb-3 flex items-center justify-between">
                <span>Точок: <span className="text-[#F5F0E8] font-medium">{drawPoints.length}</span></span>
                {(drawModeType === 'line' || drawModeType === 'measure') && drawPoints.length > 1 && (
                  <span>
                    Довжина: <span className="text-[#F5F0E8] font-medium">
                      {distance < 0.01 
                        ? `${Math.round(distance * 100000)} см` 
                        : distance < 1 
                          ? `${Math.round(distance * 1000)} м` 
                          : `${distance.toFixed(2)} км`}
                    </span>
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onFinish}
                  disabled={drawPoints.length < (drawModeType === 'measure' ? 1 : 2)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                    drawPoints.length >= (drawModeType === 'measure' ? 1 : 2)
                      ? 'bg-[#D4A843] text-[#1C1917] hover:bg-[#c49a3b]'
                      : 'bg-[#44403C] text-[#A8A29E] cursor-not-allowed'
                  }`}
                >
                  {drawModeType === 'measure' ? 'Очистити' : 'Готово'}
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-[#44403C] text-[#F5F0E8] hover:bg-[#57534E] transition-all active:scale-95"
                >
                  Скасувати
                </button>
              </div>
            </div>
          )}

          <TrackList
            tracks={tracks}
            onToggleVisibility={onToggleTrack}
            onDelete={onDeleteTrack}
            onUpdateColor={onUpdateTrackColor}
            onUpdateWeight={onUpdateTrackWeight}
          />
          <ZoneList
            zones={zones}
            onToggleVisibility={onToggleZone}
            onDelete={onDeleteZone}
            onUpdateName={onUpdateZoneName}
            onUpdateColor={onUpdateZoneColor}
          />
          <LineList
            lines={lines}
            onToggleVisibility={onToggleLine}
            onDelete={onDeleteLine}
            onUpdateName={onUpdateLineName}
            onUpdateColor={onUpdateLineColor}
            onUpdateWeight={onUpdateLineWeight}
          />
          <ImageList
            images={images}
            onAddImage={onAddImage}
            onToggleVisibility={onToggleImage}
            onDelete={onDeleteImage}
            onUpdateOpacity={onUpdateImageOpacity}
            onScaleImage={onScaleImage}
            activeImageId={activeImageId}
            onSelectImage={onSelectImage}
          />
        </div>

        {/* Footer stats */}
        <div className="px-4 py-3 border-t border-[#44403C] text-xs text-[#A8A29E]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Route size={12} />
              <span>{tracks.length} треків</span>
            </div>
            <div className="flex items-center gap-1.5">
              <SquareDashed size={12} />
              <span>{zones.length} зон</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Minus size={12} />
              <span>{lines.length} ліній</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Image size={12} />
              <span>{images.length} зображ.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
