"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MapPin, Navigation } from "lucide-react";

const defaultCenter = { lat: 6.5244, lng: 3.3792 };

const pinIcon = new Icon({
  iconUrl: typeof icon === "string" ? icon : (icon as any).src,
  iconRetinaUrl: typeof iconRetina === "string" ? iconRetina : (iconRetina as any).src,
  shadowUrl: typeof iconShadow === "string" ? iconShadow : (iconShadow as any).src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function DraggableMarker({
  position,
  onPositionChange,
}: {
  position: { lat: number; lng: number };
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(event) {
      onPositionChange(event.latlng.lat, event.latlng.lng);
    },
  });

  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom());
  }, [map, position]);

  return (
    <Marker
      position={[position.lat, position.lng]}
      draggable={true}
      icon={pinIcon}
      eventHandlers={{
        dragend: (event) => {
          const marker = event.target;
          const { lat, lng } = marker.getLatLng();
          onPositionChange(lat, lng);
        },
      }}
    />
  );
}

export function LocationEditor({
  endpoint,
  title,
  description,
  initialAddress = "",
  initialLatitude,
  initialLongitude,
}: {
  endpoint: string;
  title: string;
  description: string;
  initialAddress?: string;
  initialLatitude?: number;
  initialLongitude?: number;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [latitude, setLatitude] = useState(initialLatitude ?? defaultCenter.lat);
  const [longitude, setLongitude] = useState(initialLongitude ?? defaultCenter.lng);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(
    "Enter a street address or drag the map pin to confirm the exact location."
  );

  const markerPosition = useMemo(
    () => ({ lat: Number(latitude) || defaultCenter.lat, lng: Number(longitude) || defaultCenter.lng }),
    [latitude, longitude]
  );

  async function handleGeocode() {
    const trimmed = address.trim();

    if (!trimmed) {
      setStatus("Please enter an address before searching.");
      return;
    }

    setIsSearching(true);
    setStatus("Searching for the address using Nominatim...");

    try {
      const response = await fetch("/api/location/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });

      const data = await response.json();

      if (!response.ok || !data?.results?.length) {
        setStatus(
          data?.error ||
            "No match was found for that address. You can drag the pin manually and save the location."
        );
        return;
      }

      const match = data.results[0];
      const lat = Number(match.lat);
      const lng = Number(match.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setStatus("The geocoder returned an invalid result. You can drag the pin manually and save instead.");
        return;
      }

      setLatitude(lat);
      setLongitude(lng);
      setStatus("Location found. Adjust the pin if needed, then save.");
    } catch (error) {
      setStatus(
        "Geocoding failed. You can still drag the map pin manually and save a verified location."
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported by your browser. Please enter an address manually.");
      return;
    }

    setIsSearching(true);
    setStatus("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setStatus("Location detected! Adjust the pin if needed, then save.");
        setIsSearching(false);

        // Reverse geocode to get address
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.display_name) {
              setAddress(data.display_name);
            }
          })
          .catch(() => {});
      },
      (error) => {
        setIsSearching(false);
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("Location permission denied. Please allow location access or enter an address manually.");
        } else {
          setStatus("Unable to detect your location. Please enter an address manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setStatus("Saving your location...");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          latitude,
          longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data?.error || "Unable to save the location.");
        return;
      }

      setStatus("Location saved successfully.");
    } catch (error) {
      setStatus("Something went wrong while saving the location.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan">Location</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1 text-xs text-cyan">
          Live map pin
        </div>
      </div>

      <p className="text-sm text-white/70">{description}</p>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <Input
            label="Address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="e.g., 22 Marina Road, Lagos"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" variant="primary" onClick={handleGeocode} disabled={isSearching || isSaving}>
            {isSearching ? "Searching..." : "Find address"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleUseMyLocation} disabled={isSearching || isSaving}>
            <Navigation className="mr-2 h-4 w-4" />
            My location
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10" style={{ height: "400px", zIndex: 0 }}>
        <MapContainer
          center={[markerPosition.lat, markerPosition.lng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker
            position={markerPosition}
            onPositionChange={(nextLat, nextLng) => {
              setLatitude(nextLat);
              setLongitude(nextLng);
            }}
          />
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Current pin</p>
          <p className="mt-1 text-sm text-white/80">
            {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
          </p>
        </div>
        <Button type="button" variant="gold" onClick={handleSave} disabled={isSaving || isSearching}>
          {isSaving ? "Saving..." : "Save location"}
        </Button>
      </div>

      <p className="text-sm text-cyan/80">{status}</p>
    </Card>
  );
}
