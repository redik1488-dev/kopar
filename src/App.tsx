import { useState, useCallback, useEffect } from 'react';
import MapView from '@/components/MapView';
import Toolbar from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';
import WaypointModal from '@/components/WaypointModal';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { useFirestoreDoc } from '@/hooks/useFirestoreDoc';
import { useImageStorage } from '@/hooks/useImageStorage';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { getIDB } from '@/hooks/useImageStorage';
import type { GpxTrack, Zone, MapLine, MapLayerType, TrackPoint, ImageOverlay, Waypoint, Find } from '@/types';

function HaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTrackDistance(points: TrackPoint[]): number {
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    dist += HaversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return dist;
}

function parseGpxFile(file: File): Promise<GpxTrack | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string).replace(/xmlns=".*?"/g, '');
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');

        const trackName = xml.querySelector('trk > name')?.textContent || file.name.replace('.gpx', '');
        const trackPoints: TrackPoint[] = [];

        const trkpts = Array.from(xml.getElementsByTagName('trkpt'));
        trkpts.forEach((pt) => {
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          const eleEl = pt.querySelector('ele');
          const timeEl = pt.querySelector('time');
          const ptData: any = { lat, lng: lon };
          if (eleEl) ptData.ele = parseFloat(eleEl.textContent || '0');
          if (timeEl) ptData.time = timeEl.textContent;
          trackPoints.push(ptData);
        });

        const wpts = Array.from(xml.getElementsByTagName('wpt'));
        const waypoints: Waypoint[] = [];
        wpts.forEach((pt) => {
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          const nameEl = pt.querySelector('name');
          const descEl = pt.querySelector('desc');
          const symEl = pt.querySelector('sym');
          const wptData: any = { lat, lng: lon };
          if (nameEl) wptData.name = nameEl.textContent;
          if (descEl) wptData.desc = descEl.textContent;
          if (symEl) wptData.sym = symEl.textContent;
          waypoints.push(wptData);
        });

        if (trackPoints.length === 0 && waypoints.length === 0) {
          resolve(null);
          return;
        }

        const distance = calculateTrackDistance(trackPoints);

        resolve({
          id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: trackName || file.name,
          color: '#D4A843',
          points: trackPoints,
          waypoints,
          distance,
          pointCount: trackPoints.length,
          visible: true,
          createdAt: new Date().toISOString(),
        });
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

// Data Migration Hook
function useMigrateData() {
  useEffect(() => {
    const migrate = async () => {
      const migrated = localStorage.getItem('kopar-migrated-firebase');
      if (migrated) return;

      try {
        const batch = writeBatch(db);
        let hasData = false;
        
        const tracksStr = localStorage.getItem('kopar-tracks');
        if (tracksStr) {
          const tracks = JSON.parse(tracksStr);
          if (tracks.length) hasData = true;
          tracks.forEach((t: GpxTrack) => batch.set(doc(db, 'tracks', t.id), t));
        }

        const zonesStr = localStorage.getItem('kopar-zones');
        if (zonesStr) {
          const zones = JSON.parse(zonesStr);
          if (zones.length) hasData = true;
          zones.forEach((z: Zone) => batch.set(doc(db, 'zones', z.id), z));
        }

        const linesStr = localStorage.getItem('kopar-lines');
        if (linesStr) {
          const localLines = JSON.parse(linesStr);
          if (localLines.length) hasData = true;
          localLines.forEach((l: any) => {
            const mappedPoints = l.points.map((p: any) => Array.isArray(p) ? { lat: p[0], lng: p[1] } : p);
            batch.set(doc(db, 'lines', l.id), { ...l, points: mappedPoints });
          });
        }

        if (hasData) {
          await batch.commit();
          console.log('Local data successfully migrated to Firebase.');
        }
        localStorage.setItem('kopar-migrated-firebase', 'true');
      } catch (err) {
        console.error('Migration failed:', err);
      }

      // Migrate images from IndexedDB
      const migratedImages = localStorage.getItem('kopar-images-migrated');
      if (!migratedImages) {
        try {
          const localImages = await getIDB<ImageOverlay[]>('kopar-images');
          if (localImages && localImages.length > 0) {
            console.log('Migrating images to Firebase Storage...');
            for (const img of localImages) {
              if (img.dataUrl.startsWith('data:image')) {
                const storageRef = ref(storage, `images/${img.id}`);
                await uploadString(storageRef, img.dataUrl, 'data_url');
                const downloadUrl = await getDownloadURL(storageRef);
                const newImg = { ...img, dataUrl: downloadUrl };
                await setDoc(doc(db, 'images', img.id), newImg);
              } else {
                await setDoc(doc(db, 'images', img.id), img);
              }
            }
            console.log('Images successfully migrated.');
          }
          localStorage.setItem('kopar-images-migrated', 'true');
        } catch (err) {
          console.error('Image migration failed:', err);
        }
      }
    };
    migrate();
  }, []);
}

export default function App() {
  useMigrateData(); // Run migration once on mount

  const tracks = useFirestoreCollection<GpxTrack>('tracks');
  const zones = useFirestoreCollection<Zone>('zones');
  const lines = useFirestoreCollection<MapLine>('lines');
  const images = useFirestoreCollection<ImageOverlay>('images');

  const [mapCenter, setMapCenter] = useFirestoreDoc<[number, number]>('settings', 'global-center', [49.6515265, 23.8508696]);
  const [mapZoom, setMapZoom] = useFirestoreDoc<number>('settings', 'global-zoom', 16);
  const [viewMode, setViewMode] = useFirestoreDoc<'all' | 'waypoints_only' | 'tracks_only'>('settings', 'global-viewMode', 'all');

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('hybrid');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawModeType, setDrawModeType] = useState<'zone' | 'line' | 'measure' | null>(null);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [drawColor, setDrawColor] = useState('#4A6741');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [editingWaypoint, setEditingWaypoint] = useState<{ trackId: string; waypointIndex: number; waypoint: Waypoint } | null>(null);

  const handleLocateMe = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleSelectImage = useCallback((id: string | null) => {
    setActiveImageId(id);
  }, []);

  const handleWaypointClick = useCallback((trackId: string, waypointIndex: number) => {
    const track = tracks.find((t) => t.id === trackId);
    if (track && track.waypoints && track.waypoints[waypointIndex]) {
      setEditingWaypoint({
        trackId,
        waypointIndex,
        waypoint: track.waypoints[waypointIndex],
      });
    }
  }, [tracks]);

  const handleSaveFind = useCallback(async (trackId: string, waypointIndex: number, find: Find) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track || !track.waypoints) return;
    const newWaypoints = [...track.waypoints];
    const wpt = newWaypoints[waypointIndex];
    newWaypoints[waypointIndex] = {
      ...wpt,
      finds: [...(wpt.finds || []), find],
    };

    if (editingWaypoint?.trackId === trackId && editingWaypoint?.waypointIndex === waypointIndex) {
      setEditingWaypoint({ trackId, waypointIndex, waypoint: newWaypoints[waypointIndex] });
    }

    await updateDoc(doc(db, 'tracks', trackId), { waypoints: newWaypoints });
  }, [tracks, editingWaypoint]);

  const handleDeleteFind = useCallback(async (trackId: string, waypointIndex: number, findId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track || !track.waypoints) return;
    const newWaypoints = [...track.waypoints];
    const wpt = newWaypoints[waypointIndex];
    if (wpt.finds) {
      newWaypoints[waypointIndex] = {
        ...wpt,
        finds: wpt.finds.filter((f) => f.id !== findId),
      };

      if (editingWaypoint?.trackId === trackId && editingWaypoint?.waypointIndex === waypointIndex) {
        setEditingWaypoint({ trackId, waypointIndex, waypoint: newWaypoints[waypointIndex] });
      }
    }
    await updateDoc(doc(db, 'tracks', trackId), { waypoints: newWaypoints });
  }, [tracks, editingWaypoint]);

  const handleUpdateImageBounds = useCallback(async (id: string, bounds: { southWest: [number, number]; northEast: [number, number] }) => {
    await updateDoc(doc(db, 'images', id), { bounds });
  }, []);

  const handleImportGpx = useCallback(
    async (files: FileList) => {
      const newTracks: GpxTrack[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.toLowerCase().endsWith('.gpx')) {
          const track = await parseGpxFile(file);
          if (track) newTracks.push(track);
        }
      }
      if (newTracks.length > 0) {
        const batch = writeBatch(db);
        newTracks.forEach(t => batch.set(doc(db, 'tracks', t.id), t));
        await batch.commit();
      }
    },
    []
  );

  const handleToggleTrack = useCallback(async (id: string) => {
    const track = tracks.find(t => t.id === id);
    if (track) await updateDoc(doc(db, 'tracks', id), { visible: !track.visible });
  }, [tracks]);

  const handleDeleteTrack = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'tracks', id));
  }, []);

  const handleToggleZone = useCallback(async (id: string) => {
    const zone = zones.find(z => z.id === id);
    if (zone) await updateDoc(doc(db, 'zones', id), { visible: !zone.visible });
  }, [zones]);

  const handleDeleteZone = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'zones', id));
  }, []);

  const handleUpdateZoneName = useCallback(async (id: string, name: string) => {
    await updateDoc(doc(db, 'zones', id), { name });
  }, []);

  const handleUpdateZoneColor = useCallback(async (id: string, color: string) => {
    await updateDoc(doc(db, 'zones', id), { color });
  }, []);

  const handleUpdateTrackColor = useCallback(async (id: string, color: string) => {
    await updateDoc(doc(db, 'tracks', id), { color });
  }, []);

  const handleUpdateTrackWeight = useCallback(async (id: string, weight: number) => {
    await updateDoc(doc(db, 'tracks', id), { weight });
  }, []);

  const handleToggleLine = useCallback(async (id: string) => {
    const line = lines.find(l => l.id === id);
    if (line) await updateDoc(doc(db, 'lines', id), { visible: !line.visible });
  }, [lines]);

  const handleDeleteLine = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'lines', id));
  }, []);

  const handleUpdateLineName = useCallback(async (id: string, name: string) => {
    await updateDoc(doc(db, 'lines', id), { name });
  }, []);

  const handleUpdateLineColor = useCallback(async (id: string, color: string) => {
    await updateDoc(doc(db, 'lines', id), { color });
  }, []);

  const handleUpdateLineWeight = useCallback(async (id: string, weight: number) => {
    await updateDoc(doc(db, 'lines', id), { weight });
  }, []);

  const handleAddImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      const img = new Image();
      img.onload = async () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        const BASE_SIZE_METERS = 200;
        const METERS_PER_DEGREE_LAT = 111320;
        
        const [centerLat, centerLng] = mapCenter;
        const baseHeightDeg = BASE_SIZE_METERS / METERS_PER_DEGREE_LAT;
        const cosLat = Math.cos((centerLat * Math.PI) / 180);
        const metersPerDegreeLng = METERS_PER_DEGREE_LAT * cosLat;
        const baseWidthDeg = (BASE_SIZE_METERS * aspectRatio) / metersPerDegreeLng;
        
        const id = `img-${Date.now()}`;
        
        try {
          const storageRef = ref(storage, `images/${id}`);
          await uploadString(storageRef, dataUrl, 'data_url');
          const downloadUrl = await getDownloadURL(storageRef);
          
          const newImage: ImageOverlay = {
            id,
            name: file.name,
            dataUrl: downloadUrl,
            bounds: {
              southWest: [centerLat - baseHeightDeg / 2, centerLng - baseWidthDeg / 2],
              northEast: [centerLat + baseHeightDeg / 2, centerLng + baseWidthDeg / 2],
            },
            opacity: 0.7,
            aspectRatio,
            visible: true,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'images', id), newImage);
          setActiveImageId(id);
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [mapCenter]);

  const handleToggleImage = useCallback(async (id: string) => {
    const img = images.find((i) => i.id === id);
    if (img) await updateDoc(doc(db, 'images', id), { visible: !img.visible });
  }, [images]);

  const handleDeleteImage = useCallback(async (id: string) => {
    try {
      await deleteObject(ref(storage, `images/${id}`));
    } catch (e) {
      console.warn("Could not delete from storage, might not exist", e);
    }
    await deleteDoc(doc(db, 'images', id));
    if (activeImageId === id) setActiveImageId(null);
  }, [activeImageId]);

  const handleUpdateImageOpacity = useCallback(async (id: string, opacity: number) => {
    await updateDoc(doc(db, 'images', id), { opacity });
  }, []);

  const handleScaleImage = useCallback(async (id: string, scale: number) => {
    const img = images.find((i) => i.id === id);
    if (!img) return;
    const centerLat = (img.bounds.northEast[0] + img.bounds.southWest[0]) / 2;
    const centerLng = (img.bounds.northEast[1] + img.bounds.southWest[1]) / 2;
    const halfHeight = (img.bounds.northEast[0] - img.bounds.southWest[0]) / 2;
    const halfWidth = (img.bounds.northEast[1] - img.bounds.southWest[1]) / 2;
    const newBounds = {
      southWest: [centerLat - halfHeight * scale, centerLng - halfWidth * scale] as [number, number],
      northEast: [centerLat + halfHeight * scale, centerLng + halfWidth * scale] as [number, number],
    };
    await updateDoc(doc(db, 'images', id), { bounds: newBounds });
  }, [images]);

  const handleAddDrawPoint = useCallback((point: [number, number]) => {
    setDrawPoints((prev) => [...prev, point]);
  }, []);

  const handleSetDrawColor = useCallback((color: string) => {
    setDrawColor(color);
  }, []);

  const handleFinish = useCallback(async () => {
    if (drawPoints.length < 2) return;

    if (drawModeType === 'zone') {
      const lats = drawPoints.map((p) => p[0]);
      const lngs = drawPoints.map((p) => p[1]);
      const latMin = Math.min(...lats);
      const latMax = Math.max(...lats);
      const lngMin = Math.min(...lngs);
      const lngMax = Math.max(...lngs);

      const width = HaversineDistance(latMin, lngMin, latMin, lngMax) * 1000;
      const height = HaversineDistance(latMin, lngMin, latMax, lngMin) * 1000;
      const area = (width * height) / 10000;

      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        name: `Зона ${zones.length + 1}`,
        color: drawColor,
        bounds: { northEast: [latMax, lngMax], southWest: [latMin, lngMin] },
        area,
        visible: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'zones', newZone.id), newZone);
    } else if (drawModeType === 'line') {
      let length = 0;
      for (let i = 1; i < drawPoints.length; i++) {
        length += HaversineDistance(
          drawPoints[i - 1][0], drawPoints[i - 1][1],
          drawPoints[i][0], drawPoints[i][1]
        );
      }

      const newLine: MapLine = {
        id: `line-${Date.now()}`,
        name: `Лінія ${lines.length + 1}`,
        color: drawColor,
        points: drawPoints.map(p => ({ lat: p[0], lng: p[1] })),
        length,
        visible: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'lines', newLine.id), newLine);
    }

    setDrawPoints([]);
    setDrawModeType(null);
  }, [drawPoints, drawModeType, drawColor, zones.length, lines.length]);

  const handleCancel = useCallback(() => {
    setDrawPoints([]);
    setDrawModeType(null);
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-[#1C1917]">
      <Toolbar
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        currentLayer={activeLayer}
        onLayerChange={setActiveLayer}
        onImportGpx={handleImportGpx}
        drawModeType={drawModeType}
        drawPointsCount={drawPoints.length}
        onSetDrawModeType={(type) => {
          if (drawModeType === type) {
            handleCancel();
          } else {
            setDrawModeType(type);
          }
        }}
        onCancel={handleCancel}
        onLocateMe={handleLocateMe}
        hasLocation={!!userLocation}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((s) => !s)}
        tracks={tracks}
        zones={zones}
        lines={lines}
        images={images}
        onToggleTrack={handleToggleTrack}
        onDeleteTrack={handleDeleteTrack}
        onToggleZone={handleToggleZone}
        onDeleteZone={handleDeleteZone}
        onUpdateZoneName={handleUpdateZoneName}
        onUpdateZoneColor={handleUpdateZoneColor}
        onUpdateTrackColor={handleUpdateTrackColor}
        onUpdateTrackWeight={handleUpdateTrackWeight}
        onToggleLine={handleToggleLine}
        onDeleteLine={handleDeleteLine}
        onUpdateLineName={handleUpdateLineName}
        onUpdateLineColor={handleUpdateLineColor}
        onUpdateLineWeight={handleUpdateLineWeight}
        onAddImage={handleAddImage}
        onToggleImage={handleToggleImage}
        onDeleteImage={handleDeleteImage}
        onUpdateImageOpacity={handleUpdateImageOpacity}
        onScaleImage={handleScaleImage}
        drawPoints={drawPoints}
        drawColor={drawColor}
        onSetDrawColor={handleSetDrawColor}
        onFinish={handleFinish}
        onCancel={handleCancel}
        drawModeType={drawModeType}
        activeImageId={activeImageId}
        onSelectImage={handleSelectImage}
      />

      <div className="fixed inset-0 top-14 z-0">
        <MapView
          tracks={tracks}
          zones={zones}
          lines={lines}
          images={images}
          activeLayer={activeLayer}
          drawMode={drawModeType !== null}
          drawPoints={drawPoints}
          onAddDrawPoint={handleAddDrawPoint}
          userLocation={userLocation}
          onUserLocationSet={setUserLocation}
          initialCenter={mapCenter}
          initialZoom={mapZoom}
          onCenterChange={(center, zoom) => {
            setMapCenter(center);
            setMapZoom(zoom);
          }}
          activeImageId={activeImageId}
          onSelectImage={handleSelectImage}
          onUpdateImageBounds={handleUpdateImageBounds}
          onWaypointClick={handleWaypointClick}
          viewMode={viewMode}
        />
      </div>

      {editingWaypoint && (
        <WaypointModal
          trackId={editingWaypoint.trackId}
          waypointIndex={editingWaypoint.waypointIndex}
          waypoint={editingWaypoint.waypoint}
          onClose={() => setEditingWaypoint(null)}
          onSaveFind={handleSaveFind}
          onDeleteFind={handleDeleteFind}
        />
      )}
    </div>
  );
}
