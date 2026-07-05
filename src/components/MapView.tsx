import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GpxTrack, Zone, MapLine, MapLayerType, ImageOverlay } from '@/types';

interface MapViewProps {
  tracks: GpxTrack[];
  zones: Zone[];
  lines: MapLine[];
  images: ImageOverlay[];
  activeLayer: MapLayerType;
  drawMode: boolean;
  drawPoints: [number, number][];
  onAddDrawPoint: (point: [number, number]) => void;
  userLocation: [number, number] | null;
  onUserLocationSet: (loc: [number, number] | null) => void;
  initialCenter: [number, number];
  initialZoom: number;
  onCenterChange: (center: [number, number], zoom: number) => void;
  activeImageId: string | null;
  onSelectImage: (id: string | null) => void;
  onUpdateImageBounds: (id: string, bounds: { southWest: [number, number]; northEast: [number, number] }) => void;
  onWaypointClick: (trackId: string, waypointIndex: number) => void;
  viewMode: 'all' | 'waypoints_only' | 'tracks_only';
}

const layerConfigs: Record<MapLayerType, { url: string; attribution: string; subdomains?: string; maxNativeZoom: number }[]> = {
  satellite: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri',
      maxNativeZoom: 18,
    },
  ],
  standard: [
    {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: 'OpenStreetMap',
      subdomains: 'abc',
      maxNativeZoom: 19,
    },
  ],
  topo: [
    {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'OpenTopoMap',
      subdomains: 'abc',
      maxNativeZoom: 17,
    },
  ],
  hybrid: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri',
      maxNativeZoom: 18,
    },
    {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
      attribution: 'CartoDB',
      subdomains: 'abcd',
      maxNativeZoom: 20,
    },
  ],
  cyclosm: [
    {
      url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      attribution: 'CyclOSM',
      subdomains: 'abc',
      maxNativeZoom: 20,
    },
  ],
  esri_topo: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri',
      maxNativeZoom: 19,
    },
  ],
  google_terrain: [
    {
      url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      attribution: 'Google',
      maxNativeZoom: 20,
    },
  ],
};

export default function MapView({
  tracks,
  zones,
  lines,
  images,
  activeLayer,
  drawMode,
  drawPoints,
  onAddDrawPoint,
  userLocation,
  onUserLocationSet,
  initialCenter,
  initialZoom,
  onCenterChange,
  activeImageId,
  onSelectImage,
  onUpdateImageBounds,
  onWaypointClick,
  viewMode,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer[]>([]);
  const trackLayersRef = useRef<Record<string, L.LayerGroup>>({});
  const zoneLayersRef = useRef<Record<string, L.Rectangle>>({});
  const lineLayersRef = useRef<Record<string, L.Polyline>>({});
  const imageLayersRef = useRef<Record<string, L.ImageOverlay>>({});
  const tempMarkersRef = useRef<L.CircleMarker[]>([]);
  const tempPolylineRef = useRef<L.Polyline | null>(null);
  const drawModeRef = useRef(drawMode);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userAccuracyRef = useRef<L.Circle | null>(null);
  const imageHandlesRef = useRef<Record<string, L.CircleMarker[]>>({});
  const imageBorderRef = useRef<Record<string, L.Rectangle>>({});

  const dragStateRef = useRef<{
    isDragging: boolean;
    targetImageId: string | null;
    dragType: 'move' | 'resize' | null;
    resizeCorner: number;
    startLatLng: L.LatLng | null;
    startBounds: { southWest: [number, number]; northEast: [number, number] } | null;
  }>({ isDragging: false, targetImageId: null, dragType: null, resizeCorner: -1, startLatLng: null, startBounds: null });

  // Refs to avoid stale closures in init effect
  const activeImageIdRef = useRef(activeImageId);
  const imagesRef = useRef(images);
  const onSelectImageRef = useRef(onSelectImage);
  const onUpdateImageBoundsRef = useRef(onUpdateImageBounds);
  const onUserLocationSetRef = useRef(onUserLocationSet);
  const onCenterChangeRef = useRef(onCenterChange);
  const onWaypointClickRef = useRef(onWaypointClick);

  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { activeImageIdRef.current = activeImageId; }, [activeImageId]);
  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => { onSelectImageRef.current = onSelectImage; }, [onSelectImage]);
  useEffect(() => { onUpdateImageBoundsRef.current = onUpdateImageBounds; }, [onUpdateImageBounds]);
  useEffect(() => { onUserLocationSetRef.current = onUserLocationSet; }, [onUserLocationSet]);
  useEffect(() => { onCenterChangeRef.current = onCenterChange; }, [onCenterChange]);
  useEffect(() => { onWaypointClickRef.current = onWaypointClick; }, [onWaypointClick]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 3,
      maxZoom: 24,
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: true,
    });

    mapRef.current = map;

    // Add initial tile layers
    const configs = layerConfigs[activeLayer];
    const layers = configs.map((config) =>
      L.tileLayer(config.url, {
        attribution: config.attribution,
        subdomains: config.subdomains || '',
        maxNativeZoom: config.maxNativeZoom,
        maxZoom: 24,
      }).addTo(map)
    );
    tileLayerRef.current = layers;

    // Click handler for placing draw points
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!drawModeRef.current) return;
      onAddDrawPoint([e.latlng.lat, e.latlng.lng]);
    };

    // Map mousedown for image resize handles and deselect
    const handleMapMouseDown = (e: L.LeafletMouseEvent) => {
      const currentActiveId = activeImageIdRef.current;
      const currentImages = imagesRef.current;

      // Check if clicking on a handle (resize)
      if (currentActiveId && imageHandlesRef.current[currentActiveId]) {
        const handles = imageHandlesRef.current[currentActiveId];
        const image = currentImages.find((img) => img.id === currentActiveId);
        if (image) {
          const clickPoint = map.latLngToLayerPoint(e.latlng);
          for (let i = 0; i < handles.length; i++) {
            const handlePoint = map.latLngToLayerPoint(handles[i].getLatLng());
            const dist = clickPoint.distanceTo(handlePoint);
            if (dist < 15) {
              dragStateRef.current = {
                isDragging: true,
                targetImageId: currentActiveId,
                dragType: 'resize',
                resizeCorner: i,
                startLatLng: e.latlng,
                startBounds: { ...image.bounds },
              };
              map.dragging.disable();
              return;
            }
          }
        }
      }

      // Check if clicking inside ANY image to select/move
      // Process backwards so topmost image gets clicked first
      for (let i = currentImages.length - 1; i >= 0; i--) {
        const image = currentImages[i];
        if (!image.visible) continue;
        
        const bounds = L.latLngBounds(
          [image.bounds.southWest[0], image.bounds.southWest[1]],
          [image.bounds.northEast[0], image.bounds.northEast[1]]
        );
        
        if (bounds.contains(e.latlng)) {
          if (currentActiveId !== image.id) {
            onSelectImageRef.current(image.id);
            return;
          } else {
            // It is the active image. Check for shift to drag.
            if (e.originalEvent.shiftKey) {
              dragStateRef.current = {
                isDragging: true,
                targetImageId: currentActiveId,
                dragType: 'move',
                resizeCorner: -1,
                startLatLng: e.latlng,
                startBounds: { ...image.bounds },
              };
              map.dragging.disable();
              map.boxZoom.disable();
            }
            return; // Handled click inside active image
          }
        }
      }

      // Click outside any image → deselect
      if (currentActiveId) {
        onSelectImageRef.current(null);
      }
    };

    const handleMapMouseMove = (e: L.LeafletMouseEvent) => {
      const state = dragStateRef.current;
      if (!state.isDragging || !state.targetImageId || !state.startLatLng || !state.startBounds) return;

      const image = imagesRef.current.find((img) => img.id === state.targetImageId);
      if (!image) return;

      if (state.dragType === 'resize') {
        const image = imagesRef.current.find((img) => img.id === state.targetImageId);
        if (!image || !state.startBounds) return;

        // Compute center of original bounds
        const centerLat = (state.startBounds.northEast[0] + state.startBounds.southWest[0]) / 2;
        const centerLng = (state.startBounds.northEast[1] + state.startBounds.southWest[1]) / 2;

        // Convert current degree distances to meters
        const METERS_PER_DEGREE_LAT = 111320;
        const cosLat = Math.cos((centerLat * Math.PI) / 180);
        const metersPerDegreeLng = METERS_PER_DEGREE_LAT * cosLat;

        // Original half-sizes in meters
        const origHalfHeightMeters = ((state.startBounds.northEast[0] - state.startBounds.southWest[0]) / 2) * METERS_PER_DEGREE_LAT;
        const origHalfWidthMeters = ((state.startBounds.northEast[1] - state.startBounds.southWest[1]) / 2) * metersPerDegreeLng;

        // Distance from center to dragged point in meters
        const dLatMeters = (e.latlng.lat - centerLat) * METERS_PER_DEGREE_LAT;
        const dLngMeters = (e.latlng.lng - centerLng) * metersPerDegreeLng;

        // Scale factors (using the larger to maintain aspect ratio)
        const scaleLat = origHalfHeightMeters !== 0 ? Math.abs(dLatMeters) / Math.abs(origHalfHeightMeters) : 1;
        const scaleLng = origHalfWidthMeters !== 0 ? Math.abs(dLngMeters) / Math.abs(origHalfWidthMeters) : 1;
        const scale = Math.max(scaleLat, scaleLng, 0.01);

        // New half-sizes in meters (proportional)
        const newHalfHeightMeters = Math.abs(origHalfHeightMeters) * scale;
        const newHalfWidthMeters = Math.abs(origHalfWidthMeters) * scale;

        // Convert back to degrees
        const newBounds = {
          southWest: [
            centerLat - (newHalfHeightMeters / METERS_PER_DEGREE_LAT),
            centerLng - (newHalfWidthMeters / metersPerDegreeLng),
          ] as [number, number],
          northEast: [
            centerLat + (newHalfHeightMeters / METERS_PER_DEGREE_LAT),
            centerLng + (newHalfWidthMeters / metersPerDegreeLng),
          ] as [number, number],
        };

        onUpdateImageBoundsRef.current(state.targetImageId, newBounds);
      } else if (state.dragType === 'move' && state.startLatLng) {
        const dLat = e.latlng.lat - state.startLatLng.lat;
        const dLng = e.latlng.lng - state.startLatLng.lng;
        
        const newBounds = {
          southWest: [state.startBounds.southWest[0] + dLat, state.startBounds.southWest[1] + dLng] as [number, number],
          northEast: [state.startBounds.northEast[0] + dLat, state.startBounds.northEast[1] + dLng] as [number, number],
        };
        
        onUpdateImageBoundsRef.current(state.targetImageId, newBounds);
      }
    };

    const handleMapMouseUp = () => {
      dragStateRef.current = { isDragging: false, targetImageId: null, dragType: null, resizeCorner: -1, startLatLng: null, startBounds: null };
      mapRef.current?.dragging.enable();
      mapRef.current?.boxZoom.enable();
    };

    map.on('click', handleClick);
    map.on('mousedown', handleMapMouseDown);
    map.on('mousemove', handleMapMouseMove);
    map.on('mouseup', handleMapMouseUp);

    const handleMoveEnd = () => {
      const c = map.getCenter();
      const z = map.getZoom();
      onCenterChangeRef.current([c.lat, c.lng], z);
    };
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('click', handleClick);
      map.off('mousedown', handleMapMouseDown);
      map.off('mousemove', handleMapMouseMove);
      map.off('mouseup', handleMapMouseUp);
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapRef.current = null;
    };
  }, []); // Only run once on mount

  // Update cursor when drawMode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    if (drawMode) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
  }, [drawMode]);

  // Update tile layers when activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    tileLayerRef.current.forEach((layer) => {
      map.removeLayer(layer);
    });

    const configs = layerConfigs[activeLayer];
    const newLayers = configs.map((config) =>
      L.tileLayer(config.url, {
        attribution: config.attribution,
        subdomains: config.subdomains || '',
        maxNativeZoom: config.maxNativeZoom,
        maxZoom: 24,
      }).addTo(map)
    );
    tileLayerRef.current = newLayers;
  }, [activeLayer]);

  // Update temporary draw layers (markers + polyline)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean old temp layers
    if (tempMarkersRef.current.length > 0) {
      tempMarkersRef.current.forEach((m) => map.removeLayer(m));
      tempMarkersRef.current = [];
    }
    if (tempPolylineRef.current) {
      map.removeLayer(tempPolylineRef.current);
      tempPolylineRef.current = null;
    }

    if (drawPoints.length === 0) return;

    // Add markers
    let cumulativeDistance = 0;
    tempMarkersRef.current = drawPoints.map(([lat, lng], index) => {
      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        fillColor: '#D4A843',
        color: '#F5F0E8',
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);

      if (index > 0) {
        const prev = drawPoints[index - 1];
        const dist = map.distance(prev, [lat, lng]);
        cumulativeDistance += dist;
        
        let text = '';
        if (cumulativeDistance < 10) {
          text = `${Math.round(cumulativeDistance * 100)} см`;
        } else if (cumulativeDistance < 1000) {
          text = `${Math.round(cumulativeDistance)} м`;
        } else {
          text = `${(cumulativeDistance / 1000).toFixed(2)} км`;
        }

        marker.bindTooltip(text, {
          permanent: true,
          direction: 'right',
          className: 'bg-[#1C1917] text-[#D4A843] border border-[#D4A843] font-semibold text-xs px-1.5 py-0.5 rounded shadow-md',
        });
      }

      return marker;
    });

    // Add polyline
    if (drawPoints.length >= 2) {
      tempPolylineRef.current = L.polyline(drawPoints, {
        color: '#D4A843',
        weight: 2,
        dashArray: '6,6',
        opacity: 0.8,
      }).addTo(map);
    }
  }, [drawPoints]);

  // Update tracks
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentTrackIds = new Set(tracks.filter(t => t.visible).map(t => t.id));
    Object.keys(trackLayersRef.current).forEach((id) => {
      if (!currentTrackIds.has(id)) {
        map.removeLayer(trackLayersRef.current[id]);
        delete trackLayersRef.current[id];
      }
    });

    tracks.forEach((track) => {
      if (!track.visible) return;

      if (trackLayersRef.current[track.id]) {
        map.removeLayer(trackLayersRef.current[track.id]);
      }

      const group = L.layerGroup().addTo(map);

      // 1. Полілінії (маршрути) - показуємо у режимах 'all' та 'tracks_only'
      if ((viewMode === 'all' || viewMode === 'tracks_only') && track.points && track.points.length > 0) {
        L.polyline(
          track.points.map((p) => [p.lat, p.lng] as [number, number]),
          {
            color: track.color,
            weight: track.weight || 3,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }
        ).addTo(group);
      }

      // 2. Точки (монети та інші) - показуємо у режимах 'all' та 'waypoints_only'
      if ((viewMode === 'all' || viewMode === 'waypoints_only') && track.waypoints && track.waypoints.length > 0) {
        track.waypoints.forEach((wpt, index) => {
          const firstCoin = wpt.finds?.find((f) => f.category === 'coin');
          const hasAnyFind = wpt.finds && wpt.finds.length > 0;

          // Правило від користувача: у режимах монет показуються ТІЛЬКИ точки зі знахідками (монетами)
          // Порожні точки ховаються. АЛЕ, як тоді додавати нові? 
          // Залишимо порожні точки тільки в режимі 'all', а в 'waypoints_only' - тільки монети?
          // Користувач сказав: "(монети відповідно забираються і з тими точками де ще я не вказав що це за монета)" 
          // Це означає, що порожні точки ПРИХОВАНІ в режимах 'waypoints_only' ТА 'tracks_only'.
          // Тобто порожні точки видно тільки в режимі 'all'.
          if (!hasAnyFind && viewMode !== 'all') return;

          let marker: L.Marker | L.CircleMarker;

          if (firstCoin && firstCoin.coinEra) {
            const customIcon = L.icon({
              iconUrl: `/assets/coins/coin_${firstCoin.coinEra}.png`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              className: 'rounded-full border-2 border-[#D4A843] shadow-md bg-[#1C1917]',
            });
            marker = L.marker([wpt.lat, wpt.lng], { icon: customIcon }).addTo(group);
          } else {
            marker = L.circleMarker([wpt.lat, wpt.lng], {
              radius: 6,
              fillColor: track.color,
              color: '#1C1917',
              weight: 2,
              opacity: 1,
              fillOpacity: 1,
            }).addTo(group);
          }
          
          if (wpt.name) {
            marker.bindTooltip(wpt.name, {
              direction: 'top',
              offset: [0, -10],
              className: 'font-semibold text-sm',
            });
          }

          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e.originalEvent);
            onWaypointClickRef.current(track.id, index);
          });
        });
      }

      trackLayersRef.current[track.id] = group;
    });
  }, [tracks, viewMode]);

  // Update zones
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentZoneIds = new Set(zones.filter(z => z.visible).map(z => z.id));
    Object.keys(zoneLayersRef.current).forEach((id) => {
      if (!currentZoneIds.has(id)) {
        map.removeLayer(zoneLayersRef.current[id]);
        delete zoneLayersRef.current[id];
      }
    });

    zones.forEach((zone) => {
      if (!zone.visible) return;

      if (zoneLayersRef.current[zone.id]) {
        map.removeLayer(zoneLayersRef.current[zone.id]);
      }

      const rectangle = L.rectangle(
        [
          [zone.bounds.southWest[0], zone.bounds.southWest[1]],
          [zone.bounds.northEast[0], zone.bounds.northEast[1]],
        ],
        {
          color: zone.color,
          weight: 2,
          opacity: 0.8,
          fillColor: zone.color,
          fillOpacity: 0.2,
        }
      ).addTo(map);

      zoneLayersRef.current[zone.id] = rectangle;
    });
  }, [zones]);

  // Update lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentLineIds = new Set(lines.filter(l => l.visible).map(l => l.id));
    Object.keys(lineLayersRef.current).forEach((id) => {
      if (!currentLineIds.has(id)) {
        map.removeLayer(lineLayersRef.current[id]);
        delete lineLayersRef.current[id];
      }
    });

    lines.forEach((line) => {
      if (!line.visible) return;

      if (lineLayersRef.current[line.id]) {
        map.removeLayer(lineLayersRef.current[line.id]);
      }

      const polyline = L.polyline(
        line.points.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: line.color,
          weight: line.weight || 3,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }
      ).addTo(map);

      lineLayersRef.current[line.id] = polyline;
    });
  }, [lines]);

  // Update image overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentImageIds = new Set(images.filter((img) => img.visible).map((img) => img.id));

    // Clean up removed overlays first
    Object.keys(imageLayersRef.current).forEach((id) => {
      if (!currentImageIds.has(id)) {
        const overlay = imageLayersRef.current[id];
        if ((overlay as any)._koparCleanup) {
          (overlay as any)._koparCleanup();
        }
        map.removeLayer(overlay);
        delete imageLayersRef.current[id];
      }
    });

    images.forEach((image) => {
      if (!image.visible) return;

      if (imageLayersRef.current[image.id]) {
        const existingOverlay = imageLayersRef.current[image.id];
        if ((existingOverlay as any)._koparCleanup) {
          (existingOverlay as any)._koparCleanup();
        }
        map.removeLayer(existingOverlay);
      }

      const imgOverlay = L.imageOverlay(
        image.dataUrl,
        [
          [image.bounds.southWest[0], image.bounds.southWest[1]],
          [image.bounds.northEast[0], image.bounds.northEast[1]],
        ],
        {
          opacity: image.opacity,
          interactive: false,
        }
      ).addTo(map);

      imageLayersRef.current[image.id] = imgOverlay;
    });
  }, [images]);

  // User location effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (userAccuracyRef.current) map.removeLayer(userAccuracyRef.current);

    userMarkerRef.current = L.circleMarker(userLocation, {
      radius: 8,
      fillColor: '#22C55E',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 1,
    }).addTo(map);

    userAccuracyRef.current = L.circle(userLocation, {
      radius: 50,
      color: '#22C55E',
      weight: 1,
      fillColor: '#22C55E',
      fillOpacity: 0.1,
    }).addTo(map);

    map.flyTo(userLocation, 16, { duration: 1.5 });
  }, [userLocation]);

  // Handle selection effect - show border and handles for active image
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear all existing handles and borders
    Object.values(imageHandlesRef.current).flat().forEach((h) => {
      if (map.hasLayer(h)) map.removeLayer(h);
    });
    Object.values(imageBorderRef.current).forEach((b) => {
      if (map.hasLayer(b)) map.removeLayer(b);
    });
    imageHandlesRef.current = {};
    imageBorderRef.current = {};

    if (!activeImageId) return;

    const image = images.find((img) => img.id === activeImageId);
    if (!image || !image.visible) return;

    // Show border
    const border = L.rectangle(
      [
        [image.bounds.southWest[0], image.bounds.southWest[1]],
        [image.bounds.northEast[0], image.bounds.northEast[1]],
      ],
      {
        color: '#D4A843',
        weight: 2,
        dashArray: '5,5',
        fill: false,
      }
    ).addTo(map);
    imageBorderRef.current[activeImageId] = border;

    // Show 4 corner handles
    const corners = [
      { lat: image.bounds.southWest[0], lng: image.bounds.southWest[1] },
      { lat: image.bounds.southWest[0], lng: image.bounds.northEast[1] },
      { lat: image.bounds.northEast[0], lng: image.bounds.southWest[1] },
      { lat: image.bounds.northEast[0], lng: image.bounds.northEast[1] },
    ];

    const handles = corners.map((corner) =>
      L.circleMarker([corner.lat, corner.lng], {
        radius: 6,
        fillColor: '#D4A843',
        color: '#1C1917',
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map)
    );
    imageHandlesRef.current[activeImageId] = handles;
  }, [activeImageId, images]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%' }}
      className="leaflet-dark"
    />
  );
}
