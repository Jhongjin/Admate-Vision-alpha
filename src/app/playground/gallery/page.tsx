"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Camera, Tag, Clock, MapPin, X, ArrowUpRight } from "lucide-react";
import Image from "next/image";

// Mock Data for Gallery
const galleryItems = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1544985337-c86ef0f3f227?q=80&w=600&auto=format&fit=crop",
    location: "Gangnam Station Exit 11",
    time: "2024-02-08 14:30",
    tags: ["Digital Billboard", "Daytime", "Crowded"],
    confidence: "99.2%",
    status: "verified"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1570174092758-2023cb23438e?q=80&w=600&auto=format&fit=crop",
    location: "Yeouido Transfer Center",
    time: "2024-02-08 13:15",
    tags: ["Bus Shelter", "Static", "Sunny"],
    confidence: "98.5%",
    status: "verified"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?q=80&w=600&auto=format&fit=crop",
    location: "Hongdae Main Street",
    time: "2024-02-07 22:45",
    tags: ["Neon Sign", "Night", "Rain"],
    confidence: "94.1%",
    status: "review_needed"
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1494587351196-bbf560c4832d?q=80&w=600&auto=format&fit=crop",
    location: "Olympic Highway",
    time: "2024-02-08 09:20",
    tags: ["Billboard", "Highway", "Clear"],
    confidence: "97.8%",
    status: "verified"
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1517260739337-6799d2eb9ce0?q=80&w=600&auto=format&fit=crop",
    location: "COEX Mall Interior",
    time: "2024-02-08 11:05",
    tags: ["Indoor LCD", "Video", "High Traffic"],
    confidence: "99.9%",
    status: "verified"
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1557053503-0c252e5c8093?q=80&w=600&auto=format&fit=crop",
    location: "Jamsil Lotte Tower",
    time: "2024-02-07 19:30",
    tags: ["LED Facade", "Night", "Landmark"],
    confidence: "95.5%",
    status: "verified"
  }
];

const allTags = ["All", "Digital Billboard", "Bus Shelter", "Night", "Daytime", "Rain", "Indoor"];

export default function GalleryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  // Filtering Logic
  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = selectedTag === "All" || item.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
            Smart Image Gallery
          </h1>
          <p className="text-neutral-400 mt-1">AI-powered visual search for your ad campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button className="bg-white text-black hover:bg-neutral-200 border-0">
            <Camera className="mr-2 h-4 w-4" />
            Upload New
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input 
              placeholder="Search locations, tags, or time..." 
              className="pl-10 bg-neutral-900 border-neutral-800 text-white focus:ring-violet-500 focus:border-violet-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="text-neutral-400 hover:text-white">
            <Filter className="mr-2 h-4 w-4" />
            Advanced
          </Button>
        </div>

        {/* Tag Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allTags.map((tag) => (
            <Badge 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              variant={selectedTag === tag ? "default" : "secondary"}
              className={`cursor-pointer px-4 py-1.5 transition-all ${
                selectedTag === tag 
                  ? "bg-violet-600 hover:bg-violet-700 text-white" 
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="group relative break-inside-avoid">
            <Card className="bg-neutral-900 border-neutral-800 overflow-hidden hover:border-violet-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image 
                  src={item.url} 
                  alt={item.location}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className={`backdrop-blur-md border-0 ${
                    item.status === 'verified' 
                      ? 'bg-emerald-500/80 text-white' 
                      : 'bg-yellow-500/80 text-white'
                  }`}>
                    {item.status === 'verified' ? 'Verified' : 'Review Needed'}
                  </Badge>
                </div>
                {/* Confidence Score */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center text-xs text-white/90">
                    <span className="font-semibold text-violet-300 mr-2">AI Confidence:</span>
                    {item.confidence}
                  </div>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Location & Time */}
                <div>
                  <h3 className="font-semibold text-white truncate flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-violet-400" />
                    {item.location}
                  </h3>
                  <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5 opacity-50" />
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500">
            <X className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No images found</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
