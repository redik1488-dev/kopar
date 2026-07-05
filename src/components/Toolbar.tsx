import { Menu, Pickaxe, SquareDashed, Minus, LocateFixed, Ruler } from 'lucide-react';
import LayerSwitcher from './LayerSwitcher';
import GpxUploader from './GpxUploader';
import type { MapLayerType } from '@/types';

interface ToolbarProps {
  onToggleSidebar: () => void;
  currentLayer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
  onImportGpx: (files: FileList) => void;
  drawModeType: 'zone' | 'line' | 'measure' | null;
  drawPointsCount: number;
  onSetDrawModeType: (type: 'zone' | 'line' | 'measure') => void;
  onCancel: () => void;
  onLocateMe: () => void;
  hasLocation: boolean;
  viewMode: 'all' | 'waypoints_only' | 'tracks_only';
  onSetViewMode: (mode: 'all' | 'waypoints_only' | 'tracks_only') => void;
}

export default function Toolbar({
  onToggleSidebar,
  currentLayer,
  onLayerChange,
  onImportGpx,
  drawModeType,
  drawPointsCount,
  onSetDrawModeType,
  onCancel,
  onLocateMe,
  hasLocation,
  viewMode,
  onSetViewMode,
}: ToolbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[rgba(28,25,23,0.92)] backdrop-blur-md border-b border-[#44403C] z-[1000] flex items-center px-2 md:px-3 gap-1 md:gap-2 overflow-x-auto no-scrollbar">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="flex-shrink-0 flex items-center justify-center w-9 h-9 bg-[#292524] border border-[#44403C] rounded-lg text-[#F5F0E8] hover:bg-[#44403C] transition-colors active:scale-95"
      >
        <Menu size={18} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 mr-1 md:mr-4 flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 bg-[#D4A843] rounded-lg hidden sm:flex">
          <Pickaxe size={18} className="text-[#1C1917]" />
        </div>
        <span className="text-base md:text-lg font-bold text-[#D4A843] font-[Playfair_Display] tracking-tight hidden sm:inline">КОПАР</span>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-w-[4px]" />

      {/* Controls */}
      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        <button
          onClick={onLocateMe}
          title="Моя позиція"
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-95 flex-shrink-0 ${
            hasLocation
              ? 'bg-[#22C55E] text-white'
              : 'bg-[#292524] border border-[#44403C] text-[#F5F0E8] hover:border-[#D4A843]'
          }`}
        >
          <LocateFixed size={18} />
        </button>
        <button
          onClick={() => {
            if (viewMode === 'all') onSetViewMode('waypoints_only');
            else if (viewMode === 'waypoints_only') onSetViewMode('tracks_only');
            else onSetViewMode('all');
          }}
          title={viewMode === 'all' ? 'Монети + Маршрути' : viewMode === 'waypoints_only' ? 'Тільки монети' : 'Тільки маршрути'}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-95 flex-shrink-0 ${
            viewMode === 'tracks_only'
              ? 'bg-[#292524] border border-[#44403C] text-[#A8A29E] hover:border-[#D4A843]'
              : 'bg-[#D4A843] text-[#1C1917]'
          }`}
        >
          {viewMode === 'all' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ) : viewMode === 'waypoints_only' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
          )}
        </button>
        <div className="flex-shrink-0 hidden sm:block">
          <LayerSwitcher currentLayer={currentLayer} onLayerChange={onLayerChange} />
        </div>
        <div className="flex-shrink-0 hidden sm:block">
          <GpxUploader onUpload={onImportGpx} />
        </div>
        
        <div className="flex items-center gap-0.5 md:gap-1 bg-[#292524] border border-[#44403C] rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => onSetDrawModeType('zone')}
            className={`px-2 md:px-3 py-1.5 md:py-2 rounded-md text-sm font-medium transition-all flex items-center ${
              drawModeType === 'zone'
                ? 'bg-[#D4A843] text-[#1C1917]'
                : 'text-[#F5F0E8] hover:bg-[#44403C]'
            }`}
            title="Прямокутна зона"
          >
            <SquareDashed size={16} className="md:mr-1" />
            <span className="hidden md:inline">Зона</span>
          </button>
          <button
            onClick={() => onSetDrawModeType('line')}
            className={`px-2 md:px-3 py-1.5 md:py-2 rounded-md text-sm font-medium transition-all flex items-center ${
              drawModeType === 'line'
                ? 'bg-[#D4A843] text-[#1C1917]'
                : 'text-[#F5F0E8] hover:bg-[#44403C]'
            }`}
            title="Лінія"
          >
            <Minus size={16} className="md:mr-1" />
            <span className="hidden md:inline">Лінія</span>
          </button>
          <button
            onClick={() => onSetDrawModeType('measure')}
            className={`px-2 md:px-3 py-1.5 md:py-2 rounded-md text-sm font-medium transition-all flex items-center ${
              drawModeType === 'measure'
                ? 'bg-[#D4A843] text-[#1C1917]'
                : 'text-[#F5F0E8] hover:bg-[#44403C]'
            }`}
            title="Лінійка"
          >
            <Ruler size={16} className="md:mr-1" />
            <span className="hidden md:inline">Лінійка</span>
          </button>
        </div>
        {drawModeType !== null && (
          <button
            onClick={onCancel}
            className="px-2 md:px-3 py-1.5 md:py-2.5 rounded-lg text-sm font-medium bg-[#EF4444] text-white hover:bg-[#dc2626] transition-all flex-shrink-0"
          >
            <span className="hidden md:inline">Скасувати</span> ({drawPointsCount})
          </button>
        )}
      </div>
    </header>
  );
}
