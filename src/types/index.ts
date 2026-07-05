export interface TrackPoint {
  lat: number;
  lng: number;
  ele?: number;
  time?: string;
}

export interface Find {
  id: string;
  category: 'coin' | 'ring' | 'other';
  coinEra?: 'austro' | 'polish' | 'soviet';
  coinMaterial?: 'silver' | 'copper' | 'bronze';
  description?: string;
  createdAt: string;
}

export interface Waypoint {
  lat: number;
  lng: number;
  name?: string;
  desc?: string;
  sym?: string;
  finds?: Find[];
}

export interface GpxTrack {
  id: string;
  name: string;
  color: string;
  points: TrackPoint[];
  waypoints?: Waypoint[];
  distance: number; // in kilometers
  pointCount: number;
  weight?: number;
  visible: boolean;
  createdAt: string;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  bounds: {
    northEast: [number, number];
    southWest: [number, number];
  };
  area: number; // in hectares
  visible: boolean;
  createdAt: string;
}

export interface MapLine {
  id: string;
  name: string;
  color: string;
  points: { lat: number; lng: number }[];
  length: number; // in km
  weight?: number;
  visible: boolean;
  createdAt: string;
}

export interface ImageOverlay {
  id: string;
  name: string;
  dataUrl: string;
  bounds: {
    southWest: [number, number];
    northEast: [number, number];
  };
  opacity: number; // 0-1
  aspectRatio: number; // width / height
  visible: boolean;
  createdAt: string;
}

export type MapLayerType = 'satellite' | 'standard' | 'topo' | 'hybrid' | 'cyclosm' | 'esri_topo' | 'google_terrain';

export interface MapLayer {
  id: MapLayerType;
  name: string;
  url: string;
  attribution: string;
}
