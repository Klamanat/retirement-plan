"use client";

import { useEffect, useState, useCallback, useRef, memo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PinModal from "./PinModal";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Current position marker (blue dot)
const currentPosIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface Pin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  note: string | null;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface FlyTarget {
  lat: number;
  lng: number;
  zoom?: number;
}

// ── inner components ──────────────────────────────────────────────────────────

const ClickHandler = memo(function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
});

const MapController = memo(function MapController({ target }: { target: FlyTarget | null }) {
  const map = useMap();
  const prevTarget = useRef<FlyTarget | null>(null);
  useEffect(() => {
    if (target && target !== prevTarget.current) {
      prevTarget.current = target;
      map.flyTo([target.lat, target.lng], target.zoom ?? 15, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
});

// ── main component ────────────────────────────────────────────────────────────

export default function MapClient() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);

  // search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // current position
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // ── fetch saved pins ──
  const fetchPins = useCallback(async () => {
    const res = await fetch("/api/pins");
    if (res.ok) setPins(await res.json());
  }, []);

  useEffect(() => { fetchPins(); }, [fetchPins]);

  // ── close dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── search (debounced Nominatim) ──
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(async () => {
      // Cancel any in-flight request before starting a new one
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=6&addressdetails=0`,
          { headers: { "Accept-Language": "th,en" }, signal: abortRef.current.signal }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setShowResults(true);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleSelectResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setFlyTarget({ lat, lng, zoom: 15 });
    setPendingPin({ lat, lng });
    setQuery(r.display_name.split(",")[0]);
    setShowResults(false);
    setResults([]);
  };

  // ── current position ──
  const handleLocate = () => {
    if (!navigator.geolocation) return alert("Browser ไม่รองรับ Geolocation");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentPos({ lat, lng });
        setFlyTarget({ lat, lng, zoom: 16 });
        setPendingPin({ lat, lng });
        setLocating(false);
      },
      () => {
        alert("ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาต Location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── save pin ──
  const handleConfirm = async (name: string, note: string) => {
    if (!pendingPin) return;
    const res = await fetch("/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, lat: pendingPin.lat, lng: pendingPin.lng, note }),
    });
    if (res.ok) { setPendingPin(null); fetchPins(); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/pins?id=${id}`, { method: "DELETE" });
    fetchPins();
  };

  // ── map click ──
  const handleMapClick = (lat: number, lng: number) => {
    setPendingPin({ lat, lng });
  };

  return (
    <div className="relative h-full">
      {/* ── toolbar ── */}
      <div className="absolute top-3 left-0 right-0 z-[1000] px-3 flex gap-2">
        {/* search box */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div className="flex items-center bg-white rounded-xl shadow-md border border-gray-200 px-3 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="ค้นหาสถานที่..."
              className="flex-1 py-2.5 text-sm outline-none bg-transparent"
            />
            {searching && (
              <span className="text-xs text-gray-400 animate-pulse">กำลังค้นหา...</span>
            )}
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setShowResults(false); }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* dropdown results */}
          {showResults && results.length > 0 && (
            <ul className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
              {results.map((r) => (
                <li key={r.place_id}>
                  <button
                    onClick={() => handleSelectResult(r)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-gray-800">
                      {r.display_name.split(",")[0]}
                    </span>
                    <span className="text-gray-400 text-xs block truncate">
                      {r.display_name.split(",").slice(1).join(",").trim()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* current location button */}
        <button
          onClick={handleLocate}
          disabled={locating}
          title="ตำแหน่งปัจจุบัน"
          className="bg-white rounded-xl shadow-md border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
        >
          {locating ? (
            <span className="animate-spin">⌛</span>
          ) : (
            <span>📍</span>
          )}
          ตำแหน่งฉัน
        </button>
      </div>

      {/* ── map ── */}
      <MapContainer
        center={[13.7563, 100.5018]}
        zoom={6}
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMapClick={handleMapClick} />
        <MapController target={flyTarget} />

        {/* current position marker */}
        {currentPos && (
          <Marker position={[currentPos.lat, currentPos.lng]} icon={currentPosIcon}>
            <Popup>
              <p className="text-sm font-medium text-blue-600">ตำแหน่งของคุณ</p>
            </Popup>
          </Marker>
        )}

        {/* saved pins */}
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{pin.name}</p>
                {pin.note && <p className="text-gray-500 mt-1">{pin.note}</p>}
                <button
                  onClick={() => handleDelete(pin.id)}
                  className="mt-2 text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  ลบหมุด
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {pendingPin && (
        <PinModal
          lat={pendingPin.lat}
          lng={pendingPin.lng}
          onConfirm={handleConfirm}
          onCancel={() => setPendingPin(null)}
        />
      )}
    </div>
  );
}
