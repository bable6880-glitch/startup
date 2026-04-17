'use client';

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLocation } from "@/lib/location-context";
import Link from "next/link";

// Fix default marker icon issue in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Custom Icons
const userPulseIcon = L.divIcon({
    className: '',
    html: `
      <div class="relative flex h-4 w-4">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white"></span>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const kitchenOrangeIcon = L.divIcon({
    className: '',
    html: `<div class="h-6 w-6 bg-orange-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px]">🥡</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const kitchenGreyIcon = L.divIcon({
    className: '',
    html: `<div class="h-6 w-6 bg-gray-400 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] opacity-70">🥡</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
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
                    <Marker key={i} position={marker.position} icon={icon}>
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
