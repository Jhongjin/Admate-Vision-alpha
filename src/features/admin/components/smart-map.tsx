"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon missing in React Leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Location {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: "verified" | "pending" | "error";
  date: string;
}

const mockLocations: Location[] = [
  { id: 1, name: "강남역 11번 출구", lat: 37.4979, lng: 127.0276, status: "verified", date: "2024-02-08" },
  { id: 2, name: "삼성역 코엑스", lat: 37.5116, lng: 127.0591, status: "verified", date: "2024-02-08" },
  { id: 3, name: "홍대입구역 9번 출구", lat: 37.5575, lng: 126.9245, status: "pending", date: "2024-02-07" },
  { id: 4, name: "여의도 환승센터", lat: 37.5254, lng: 126.9265, status: "verified", date: "2024-02-08" },
  { id: 5, name: "성수동 카페거리", lat: 37.5447, lng: 127.0560, status: "error", date: "2024-02-06" },
  { id: 6, name: "잠실 롯데타워", lat: 37.5126, lng: 127.1025, status: "verified", date: "2024-02-07" },
  { id: 7, name: "이태원역 해밀턴호텔", lat: 37.5348, lng: 126.9941, status: "pending", date: "2024-02-08" },
  { id: 8, name: "명동 예술극장", lat: 37.5635, lng: 126.9837, status: "verified", date: "2024-02-05" },
];

export default function SmartMap() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] bg-neutral-900 animate-pulse rounded-xl flex items-center justify-center text-neutral-500 border border-neutral-800">
        지도를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden shadow-2xl relative z-0 border border-neutral-800">
      <MapContainer 
        center={[37.53, 127.00]} // Center of Seoul roughly
        zoom={11} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme map tiles
        />
        {mockLocations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={icon}>
            <Popup className="custom-popup">
              <div className="p-1">
                <h3 className="font-bold text-sm mb-1 text-neutral-900">{loc.name}</h3>
                <div className="flex flex-col gap-1 text-xs text-neutral-600">
                   <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      loc.status === "verified" ? "bg-emerald-500" :
                      loc.status === "pending" ? "bg-amber-500" : "bg-rose-500"
                    }`} />
                    <span className="font-medium">
                      {loc.status === "verified" ? "검증 완료" :
                       loc.status === "pending" ? "확인 중" : "오류 감지"}
                    </span>
                   </div>
                   <div className="opacity-70">{loc.date}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-neutral-900/90 backdrop-blur-md p-3 rounded-lg border border-neutral-800 shadow-lg text-xs text-neutral-300">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 검증 완료
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> 확인 중
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> 오류/미인식
        </div>
      </div>
    </div>
  );
}
