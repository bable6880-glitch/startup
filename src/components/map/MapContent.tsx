'use client';

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLocation } from "@/lib/location-context";
import Link from "next/link";

// All marker icons use inline styles — Leaflet injects raw HTML outside
// React/Tailwind so CSS utility classes won't be processed.

const defaultPinIcon = L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))">
        <div style="width:30px;height:30px;background:#e85d04;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;box-shadow:0 2px 4px rgba(0,0,0,.2)">📍</div>
        <div style="width:3px;height:8px;background:#e85d04;border-radius:0 0 2px 2px"></div>
      </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
});

const userPulseIcon = L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:16px;height:16px">
        <span style="position:absolute;display:inline-flex;width:100%;height:100%;border-radius:50%;background:rgba(59,130,246,.5);animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite"></span>
        <span style="position:relative;display:inline-flex;width:16px;height:16px;border-radius:50%;background:#2563eb;border:2px solid #fff"></span>
      </div>
      <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const kitchenOrangeIcon = L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;background:#f97316;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:12px">🥡</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
});

const kitchenGreyIcon = L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;background:#9ca3af;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;font-size:12px;opacity:.7">🥡</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
});

type KitchenMarker = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    distanceKm: number | null;
};

type Props = {
    center: [number, number];
    zoom?: number;
    markers?: {
        position: [number, number];
        title: string;
        color?: string;
    }[];
    route?: [number, number][]; // Line between points
    kitchens?: KitchenMarker[];
};

// Auto-Fit Bounds Component
function MapBoundsManager({ 
    userLoc, 
    kitchens 
}: { 
    userLoc: { lat: number; lng: number } | null, 
    kitchens: KitchenMarker[] | undefined 
}) {
    const map = useMap();
    useEffect(() => {
        if (!userLoc) return;
        
        let bounds = L.latLngBounds([userLoc.lat, userLoc.lng], [userLoc.lat, userLoc.lng]);
        let hasPoints = false;

        if (kitchens && kitchens.length > 0) {
            kitchens.forEach(k => {
                if (k.distanceKm && k.distanceKm <= 5) {
                    bounds.extend([k.lat, k.lng]);
                    hasPoints = true;
                }
            });
        }
        
        if (hasPoints) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
            map.setView([userLoc.lat, userLoc.lng], 13);
        }
    }, [map, userLoc, kitchens]);

    return null;
}

// Locate Me Control Component
function LocateControl() {
    const { requestLocation } = useLocation();
    return (
        <div className="leaflet-top leaflet-right mt-[80px] mr-2.5 z-[1000] absolute">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    requestLocation();
                }}
                className="bg-white border-2 border-neutral-200 rounded text-sm px-2 py-1 shadow hover:bg-neutral-50 flex items-center gap-1 font-medium"
            >
                <span>📍</span> My Location
            </button>
        </div>
    );
}

export default function Map({ center, zoom = 13, markers = [], route = [], kitchens = [] }: Props) {
    const { location } = useLocation();

    return (
        <div className="relative h-full w-full">
            <MapContainer 
                center={center} 
                zoom={zoom} 
                scrollWheelZoom={false} 
                className="h-full w-full rounded-xl z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                <LocateControl />

                <MapBoundsManager 
                    userLoc={location.status === 'granted' ? { lat: location.lat, lng: location.lng } : null} 
                    kitchens={kitchens} 
                />

                {/* Legacy Markers */}
                {markers.map((marker, i) => (
                    <Marker key={i} position={marker.position} icon={defaultPinIcon}>
                        <Popup>{marker.title}</Popup>
                    </Marker>
                ))}

                {/* Kitchen Markers */}
                {kitchens.map(kitchen => {
                    const isWithin5Km = kitchen.distanceKm != null ? kitchen.distanceKm <= 5 : false;
                    return (
                        <Marker 
                            key={kitchen.id} 
                            position={[kitchen.lat, kitchen.lng]} 
                            icon={isWithin5Km ? kitchenOrangeIcon : kitchenGreyIcon}
                        >
                            <Popup>
                                <div className="text-center font-sans">
                                    <div className="font-bold text-neutral-900 mb-1">{kitchen.name}</div>
                                    <div className="text-xs text-neutral-500 mb-2">
                                        {kitchen.distanceKm != null ? `${kitchen.distanceKm} km away` : 'Distance unknown'}
                                    </div>
                                    <Link className="text-xs bg-primary-500 text-white px-3 py-1 rounded w-full inline-block" href={`/kitchen/${kitchen.id}`}>
                                        View Menu
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* User Location */}
                {location.status === 'granted' && (
                    <>
                        <Marker position={[location.lat, location.lng]} icon={userPulseIcon}>
                            <Popup>You are here</Popup>
                        </Marker>
                        <Circle 
                            center={[location.lat, location.lng]} 
                            radius={5000} 
                            pathOptions={{ fillColor: 'rgb(59 130 246)', color: 'rgb(37 99 235)', fillOpacity: 0.1, weight: 1 }} 
                        />
                    </>
                )}

                {route.length > 0 && <Polyline positions={route} color="blue" />}
            </MapContainer>
        </div>
    );
}
