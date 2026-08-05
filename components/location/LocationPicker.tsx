"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L, { type LatLngTuple } from "leaflet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const defaultCenter: LatLngTuple = [6.5244, 3.3792];

const markerIcon = L.divIcon({
  className: "custom-marker-wrapper",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      border-radius: 9999px;
      background: linear-gradient(135deg, #22d3ee, #fbbf24);
      border: 3px solid rgba(255,255,255,0.9);
      box-shadow: 0 8px 25px rgba(34,211,238,0.45);
      transform: translate(-50%, -50%);
      position: relative;
      left: 10px;
      top: 10px;
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

function MapDraggableMarker({
  position,
  onPositionChange,
}: {
  position: LatLngTuple;
  onPositionChange: (value: LatLngTuple) => void;
}) {
  useMapEvents({
    click(event) {
      onPositionChange([event.latlng.lat, event.latlng.lng]);
    },
  });

  return (
    <Marker
      position={position}
      draggable
      icon={markerIcon}
      eventHandlers={{
        dragend(event) {
          const marker = event.target as L.Marker;
          const latlng = marker.getLatLng();
          onPositionChange([latlng.lat, latlng.lng]);
        },
      }}
    />
  );
}

export function LocationPicker({
  initialAddress = "",
  initialLocation = defaultCenter,
  valueKey = "Location",
  onLocationChange,
  onAddressChange,
}: {
  initialAddress?: string;
  initialLocation?: LatLngTuple;
  valueKey?: string;
  onLocationChange: (value: { lat: number; lng: number }) => void;
  onAddressChange: (value: string) => void;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [position, setPosition] = useState<LatLngTuple>(initialLocation);
  const [status, setStatus] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    setAddress(initialAddress);
  }, [initialAddress]);

  useEffect(() => {
    setPosition(initialLocation);
  }, [initialLocation]);

  const locationSummary = useMemo(() => {
    return `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`;
  }, [position]);

  const handleMapChange = (nextPosition: LatLngTuple) => {
    setPosition(nextPosition);
    onLocationChange({ lat: nextPosition[0], lng: nextPosition[1] });
  };

  const handleGeocode = async () => {
    const trimmed = address.trim();
    if (!trimmed) {
      setStatus("Please type an address first.");
      return;
    }

    setIsGeocoding(true);
    setStatus("");

    try {
      const response = await fetch(`/api/location/geocode?address=${encodeURIComponent(trimmed)}`);
      const data = (await response.json()) as {
        ok: boolean;
        result?: { lat: number; lon: number; display_name: string };
        error?: string;
      };

      if (!response.ok || !data.ok || !data.result) {
        setStatus(data.error || "No address match found. You can still drag the map pin to your exact location.");
        return;
      }

      const nextLocation: LatLngTuple = [data.result.lat, data.result.lon];
      setPosition(nextLocation);
      onLocationChange({ lat: data.result.lat, lng: data.result.lon });
      onAddressChange(data.result.display_name || trimmed);
      setAddress(data.result.display_name || trimmed);
      setStatus("Address located. You can fine-tune the pin position on the map.");
    } catch (error) {
      setStatus("Geocoding failed. You can still drag the map pin to confirm the location manually.");
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <Input
            label={`${valueKey} address`}
            value={address}
            placeholder="e.g. 12 Ahmadu Bello Way, Lagos Nigeria"
            onChange={(event) => {
              const nextValue = event.target.value;
              setAddress(nextValue);
              onAddressChange(nextValue);
            }}
          />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="primary" onClick={handleGeocode} disabled={isGeocoding} className="h-[46px]">
            {isGeocoding ? "Locating..." : "Find on map"}
          </Button>
        </div>
      </div>

      {status ? <p className="text-sm text-cyan">{status}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50" style={{ height: 360 }}>
        <MapContainer center={position} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapDraggableMarker position={position} onPositionChange={handleMapChange} />
        </MapContainer>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-cyan/20 bg-cyan/5 px-3 py-2 text-sm text-white/80">
        <span>Confirmed coordinates</span>
        <span className="font-medium text-cyan">{locationSummary}</span>
      </div>
    </div>
  );
}
