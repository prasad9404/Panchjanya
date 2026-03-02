import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Music, Play, Pause, Image } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

// Mock Data for Audio
const audioData = [
 {
 id: "1",
 title: "Vishnu Sahasranamam",
 subtitle: "ANCIENT VEDIC",
 duration: "12:45",
 imageUrl: "https://images.unsplash.com/photo-1605406575497-015ab0d21b9b?w=200", // Abstract Sound Wave or Placeholder
 isPlaying: false,
 },
 {
 id: "2",
 title: "Shiva Tandava Stotram",
 subtitle: "Rhythmic Devotion",
 duration: "08:20",
 imageUrl: "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?w=200",
 isPlaying: false,
 },
 {
 id: "3",
 title: "Lalitha Sahasranamam",
 subtitle: "Divine Mother",
 duration: "24:12",
 imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384ebd?w=200",
 isPlaying: false,
 }
];

// Mock Data for Video
const videoData = [
 {
 id: "Bn7RDxdrSiA",
 title: "Bhagavad Geeta recitation Chapter-1",
 series: "By Astha Chhattani",
 duration: "05:32",
 thumbnailUrl: "https://img.youtube.com/vi/Bn7RDxdrSiA/maxresdefault.jpg",
 views: "1.2K"
 },
 {
 id: "dC0UvoytJ9A",
 title: "प्रसादसेवा - prasadseva",
 series: "Lyric Video",
 duration: "04:15",
 thumbnailUrl: "https://img.youtube.com/vi/dC0UvoytJ9A/maxresdefault.jpg",
 views: "850"
 },
 {
 id: "KHOfZ69p7mc",
 title: "शरण आलो मी स्वामी तुम्हाला",
 series: "श्री चक्रधर स्वामी भजन",
 duration: "06:20",
 thumbnailUrl: "https://img.youtube.com/vi/KHOfZ69p7mc/maxresdefault.jpg",
 views: "2.1K"
 },
 {
 id: "vs1GKt0uk-s",
 title: "हे स्वामी श्री चक्रधरा तव चरणी शरण आलो",
 series: "श्री चक्रधर स्वामी भजन",
 duration: "05:45",
 thumbnailUrl: "https://img.youtube.com/vi/vs1GKt0uk-s/maxresdefault.jpg",
 views: "1.5K"
 }
];

// Mock Data for Images
const imageData = [
 {
 id: "1",
 title: "Shri Swami Samarth",
 category: "Divine Portraits",
 resolution: "1920x1080",
 imageUrl: "https://images.unsplash.com/photo-1604608672516-9c88dc049e49?w=400",
 },
 {
 id: "2",
 title: "Temple Architecture",
 category: "Sacred Structures",
 resolution: "1920x1080",
 imageUrl: "https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?w=400",
 },
 {
 id: "3",
 title: "Ancient Manuscripts",
 category: "Sacred Texts",
 resolution: "2400x1600",
 imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
 },
 {
 id: "4",
 title: "Deity Shrines",
 category: "Divine Portraits",
 resolution: "1920x1200",
 imageUrl: "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=400",
 },
 {
 id: "5",
 title: "Sacred Rituals",
 category: "Devotional Practices",
 resolution: "1920x1080",
 imageUrl: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400",
 },
 {
 id: "6",
 title: "Temple Gopuram",
 category: "Sacred Structures",
 resolution: "2560x1440",
 imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400",
 },
];

function ELibrary() {
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState<"audio" | "video" | "images">("audio");

 return (
 <div className="min-h-full flex-1 lg:">
 {/* Header */}
 <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between /95 lg:/95 backdrop-blur-sm">
 <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5" onClick={() => navigate(-1)}>
 <ChevronLeft className="w-7 h-7 text-blue-900" />
 </Button>
 <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0f3c6e] font-serif">Digital Library</h1>
 <Button variant="ghost" size="icon" className="-mr-2 hover:bg-black/5">
 <Search className="w-6 h-6 text-blue-900" />
 </Button>
 </div>

 {/* Toggle Switch */}
 <div className="flex p-1 bg-gray-100 rounded-full mx-6 mb-4">
 <button
 className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${activeTab === "audio"
 ? "bg-blue-900 text-white"
 : "text-gray-500 hover:text-blue-900"
 }`}
 onClick={() => setActiveTab("audio")}
 >
 Audio
 </button>
 <button
 className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${activeTab === "video"
 ? "bg-blue-900 text-white"
 : "text-gray-500 hover:text-blue-900"
 }`}
 onClick={() => setActiveTab("video")}
 >
 Videos
 </button>
 <button
 className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${activeTab === "images"
 ? "bg-blue-900 text-white"
 : "text-gray-500 hover:text-blue-900"
 }`}
 onClick={() => setActiveTab("images")}
 >
 Images
 </button>
 </div>

 {/* Content */}
 <div className="px-6 py-6">
 {activeTab === "audio" ? (
 <div>
 <h2 className="font-heading font-bold text-2xl text-blue-900 mb-6">
 Sacred Chants
 </h2>

 {/* Featured Audio Card - Example: Vishnu Sahasranamam */}
 <div
 onClick={() => navigate("/audio/1")}
 className="bg-white rounded-2xl p-4 border border-amber-100 flex items-center gap-4 mb-6 cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
 >
 <div className="w-0.5 h-10 absolute left-0 top-1/2 -translate-y-1/2 bg-amber-500 rounded-r" />
 <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
 <span className="text-2xl">॥</span> {/* Placeholder Icon */}
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-blue-900 text-lg leading-tight mb-1">
 Vishnu Sahasranamam
 </h3>
 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
 <span>12:45</span>
 <span>•</span>
 <span>Ancient Vedic</span>
 </div>
 </div>
 <div className="w-10 h-10 rounded-full border-2 border-amber-200 flex items-center justify-center text-amber-600">
 <Pause className="w-4 h-4 fill-current" />
 </div>
 </div>

 {/* List */}
 <div className="space-y-4">
 {audioData.slice(1).map((item) => (
 <div
 key={item.id}
 onClick={() => navigate(`/audio/${item.id}`)}
 className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white hover:shadow-sm transition-all"
 >
 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400">
 <Music className="w-6 h-6" />
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-gray-800 text-base mb-1">
 {item.title}
 </h3>
 <div className="flex items-center gap-2 text-xs text-gray-500">
 <span>{item.duration}</span>
 <span>•</span>
 <span>{item.subtitle}</span>
 </div>
 </div>
 <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
 <Play className="w-3 h-3 fill-current ml-0.5" />
 </div>
 </div>
 ))}
 </div>
 </div>
 ) : activeTab === "video" ? (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h2 className="font-heading font-bold text-2xl text-blue-900">
 Dharma Pravachan
 </h2>
 <button className="text-xs font-bold text-amber-600 uppercase tracking-wider">
 View All
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {videoData.map((video) => (
 <div
 key={video.id}
 onClick={() => navigate(`/video/${video.id}`)}
 className="group cursor-pointer"
 >
 {/* Thumbnail */}
 <div className="relative aspect-video rounded-xl overflow-hidden mb-3 group-hover:shadow-lg transition-all">
 <img
 src={video.thumbnailUrl}
 alt={video.title}
 className="w-full h-full object-cover"
 />
 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
 <Play className="w-4 h-4 text-blue-900 fill-current ml-0.5" />
 </div>
 </div>
 <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
 {video.duration}
 </div>
 </div>

 {/* Info */}
 <div>
 <h3 className="font-bold text-blue-900 text-base leading-tight mb-1 group-hover:text-blue-700">
 {video.title}
 </h3>
 <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
 {video.series}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h2 className="font-heading font-bold text-2xl text-blue-900">
 Sacred Gallery
 </h2>
 <button className="text-xs font-bold text-amber-600 uppercase tracking-wider">
 View All
 </button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 {imageData.map((image) => (
 <div
 key={image.id}
 onClick={() => navigate(`/image/${image.id}`)}
 className="group cursor-pointer"
 >
 {/* Image Card */}
 <div className="relative aspect-square rounded-xl overflow-hidden mb-2 group-hover:shadow-xl transition-all">
 <img
 src={image.imageUrl}
 alt={image.title}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <div className="flex items-center justify-center">
 <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
 <Image className="w-4 h-4 text-blue-900" />
 </div>
 </div>
 </div>
 <div className="absolute top-2 right-2 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded">
 {image.resolution}
 </div>
 </div>

 {/* Info */}
 <div>
 <h3 className="font-bold text-blue-900 text-sm leading-tight mb-0.5 group-hover:text-blue-700">
 {image.title}
 </h3>
 <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
 {image.category}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div >
 );
}

export default ELibrary;
