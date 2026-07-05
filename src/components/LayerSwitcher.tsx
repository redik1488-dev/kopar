import { useState } from 'react';
import { Map, Satellite, Mountain, Layers, ChevronDown, Compass, Globe } from 'lucide-react';
import type { MapLayerType } from '@/types';

interface LayerSwitcherProps {
  currentLayer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
}

const layers = [
  { id: 'satellite' as MapLayerType, name: 'Супутник (Esri)', icon: Satellite },
  { id: 'hybrid' as MapLayerType, name: 'Гібрид (Esri)', icon: Layers },
  { id: 'standard' as MapLayerType, name: 'Стандартна (OSM)', icon: Map },
  { id: 'topo' as MapLayerType, name: 'Топографічна (OpenTopo)', icon: Mountain },
  { id: 'cyclosm' as MapLayerType, name: 'Топографічна (CyclOSM)', icon: Compass },
  { id: 'esri_topo' as MapLayerType, name: 'Топографічна (Esri)', icon: Globe },
  { id: 'google_terrain' as MapLayerType, name: 'Топографічна (Google)', icon: Mountain },
];

export default function LayerSwitcher({ currentLayer, onLayerChange }: LayerSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = layers.find((l) => l.id === currentLayer) || layers[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 bg-[#292524] border border-[#44403C] text-[#F5F0E8] rounded-lg hover:border-[#D4A843] transition-colors duration-200"
      >
        <Icon size={16} />
        <span className="text-sm font-medium">{current.name}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-52 bg-[#292524] border border-[#44403C] rounded-xl shadow-xl overflow-hidden z-[1000]">
            {layers.map((layer) => {
              const LayerIcon = layer.icon;
              return (
                <button
                  key={layer.id}
                  onClick={() => {
                    onLayerChange(layer.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                    layer.id === currentLayer
                      ? 'bg-[rgba(212,168,67,0.15)] text-[#D4A843]'
                      : 'text-[#F5F0E8] hover:bg-[#44403C]'
                  }`}
                >
                  <LayerIcon size={16} />
                  <span className="text-sm font-medium">{layer.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
