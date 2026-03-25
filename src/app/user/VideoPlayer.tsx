import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Bookmark, Share2, Play, BookOpen, MapPin, ScrollText } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { db } from "@/auth/firebase";
import { doc, getDoc } from "firebase/firestore";

interface VideoContent {
 id: string;
 title: string;
 category: string;
 duration: string;
 views: number;
 videoUrl: string;
 thumbnailUrl: string;
 contextNotes?: {
 historicalContext?: string;
 scripturalInsights?: Array<{
 title: string;
 content: string;
 }>;
 geographicSignificance?: string;
 };
 relatedMedia?: string[];
}

export default function VideoPlayer() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const [video, setVideo] = useState<VideoContent | null>(null);
 const [activeTab, setActiveTab] = useState<"context" | "related">("context");

 // Mock Data Store
 const mockVideos: Record<string, VideoContent> = {
 "Bn7RDxdrSiA": {
 id: "Bn7RDxdrSiA",
 title: "Bhagavad Geeta recitation Chapter-1",
 category: "WISDOM SERIES",
 duration: "05:32",
 views: 1200,
 videoUrl: "https://www.youtube.com/embed/Bn7RDxdrSiA",
 thumbnailUrl: "https://img.youtube.com/vi/Bn7RDxdrSiA/maxresdefault.jpg",
 contextNotes: {
 historicalContext: "The Bhagavad Gita, often referred to as the Gita, is a 700-verse Hindu scripture that is part of the epic Mahabharata.",
 scripturalInsights: [{ title: "CHAPTER 1", content: "Arjuna Visada Yoga - The Yoga of Arjuna's Dejection." }],
 geographicSignificance: "Kurukshetra, the battlefield where the Gita was spoken."
 }
 },
 "dC0UvoytJ9A": {
 id: "dC0UvoytJ9A",
 title: "प्रसादसेवा - prasadseva",
 category: "DEVOTIONAL",
 duration: "04:15",
 views: 850,
 videoUrl: "https://www.youtube.com/embed/dC0UvoytJ9A",
 thumbnailUrl: "https://img.youtube.com/vi/dC0UvoytJ9A/maxresdefault.jpg",
 contextNotes: {
  historicalContext: "A devotional lyric video dedicated to Shri Chakradhar Swami.",
 scripturalInsights: [],
 geographicSignificance: "N/A"
 }
 },
 "KHOfZ69p7mc": {
 id: "KHOfZ69p7mc",
 title: "शरण आलो मी स्वामी तुम्हाला",
 category: "BHAJAN",
 duration: "06:20",
 views: 2100,
 videoUrl: "https://www.youtube.com/embed/KHOfZ69p7mc",
 thumbnailUrl: "https://img.youtube.com/vi/KHOfZ69p7mc/maxresdefault.jpg",
 contextNotes: {
 historicalContext: "A soulful bhajan expressing surrender to Shri Chakradhar Swami.",
 scripturalInsights: [],
 geographicSignificance: "N/A"
 }
 },
 "vs1GKt0uk-s": {
 id: "vs1GKt0uk-s",
 title: "हे स्वामी श्री चक्रधरा तव चरणी शरण आलो",
 category: "BHAJAN",
 duration: "05:45",
 views: 1500,
 videoUrl: "https://www.youtube.com/embed/vs1GKt0uk-s",
 thumbnailUrl: "https://img.youtube.com/vi/vs1GKt0uk-s/maxresdefault.jpg",
 contextNotes: {
  historicalContext: "Devotional song praising the lotus feet of Shri Chakradhar Swami.",
 scripturalInsights: [],
 geographicSignificance: "N/A"
 }
 },
 // Fallback
 "default": {
 id: "1",
 title: "Dharma Pravachan - Shri Chakradhar Swami",
 category: "SPIRITUAL HERITAGE",
 duration: "22:05",
 views: 1200000,
 videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
 thumbnailUrl: "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800",
 contextNotes: {
 historicalContext: "Shri Chakradhar Swami founded the Mahanubhava sect in the 13th century.",
 scripturalInsights: [{ title: "VERSE 42", content: "The Path of Devotion." }],
 geographicSignificance: "Paithan, Maharashtra."
 }
 }
 };

 useEffect(() => {
 // In a real app, we would fetch from DB. 
 // For now, using mock based on ID from URL.
 const mockData = (id && mockVideos[id]) ? mockVideos[id] : mockVideos["default"];
 setVideo(mockData);
 }, [id]);

 if (!video) {
 return (
 <div className="min-h-full flex-1 flex items-center justify-center ">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900" />
 </div>
 );
 }

 const isYouTube = video.videoUrl.includes("youtube.com/embed");

 return (
 <div className="min-h-full flex-1 ">
 {/* Video Player Header (Absolute) */}
 {/* Video Player Header */}
 <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between bg-background/95 /95 backdrop-blur-sm">
 <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5 rounded-full" onClick={() => navigate(-1)}>
 <ChevronLeft className="w-7 h-7 text-blue-900" />
 </Button>
 <div className="flex gap-1">
 <Button variant="ghost" size="icon" className="hover:bg-black/5 rounded-full">
 <Bookmark className="w-6 h-6 text-blue-900" />
 </Button>
 <Button variant="ghost" size="icon" className="-mr-2 hover:bg-black/5 rounded-full">
 <Share2 className="w-6 h-6 text-blue-900" />
 </Button>
 </div>
 </div>

 {/* Video Player Container */}
 <div className="relative aspect-video bg-black w-full">
 {isYouTube ? (
 <iframe
 src={`${video.videoUrl}?autoplay=1&rel=0`}
 title={video.title}
 className="w-full h-full"
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 />
 ) : (
 <video
 src={video.videoUrl}
 poster={video.thumbnailUrl}
 controls
 className="w-full h-full object-contain"
 />
 )}
 </div>

 {/* Content */}
 <div className="bg-white rounded-t-3xl -mt-6 relative z-10 pt-8 px-6 pb-20 shadow-[-10px_-10px_30px_rgba(0,0,0,0.05)]">

 {/* Title and Info */}
 <h1 className="font-heading font-bold text-2xl text-blue-900 mb-2 leading-tight">
 {video.title}
 </h1>
 <div className="flex items-center gap-3 text-sm mb-6">
 <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
 {video.category}
 </span>
 <span className="text-gray-400 font-bold text-lg">•</span>
 <span className="text-gray-500 font-medium">
 {video.views >= 1000000
 ? `${(video.views / 1000000).toFixed(1)}M`
 : `${Math.floor(video.views / 1000)}K`}{" "}
 Views
 </span>
 </div>

 {/* Tabs */}
 <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
 <button
 onClick={() => setActiveTab("context")}
 className={`flex-1 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all ${activeTab === "context"
 ? "bg-blue-900 text-white shadow-sm"
 : "text-gray-500 hover:text-blue-900"
 }`}
 >
 Context Notes
 </button>
 <button
 onClick={() => setActiveTab("related")}
 className={`flex-1 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all ${activeTab === "related"
 ? "bg-blue-900 text-white shadow-sm"
 : "text-gray-500 hover:text-blue-900"
 }`}
 >
 Related Media
 </button>
 </div>

 {/* Tab Content */}
 {activeTab === "context" ? (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

 {/* 1. Historical Context */}
 {video.contextNotes?.historicalContext && (
 <div>
 <div className="flex items-center gap-2 mb-3 text-amber-600">
 <ScrollText className="w-5 h-5" />
 <h3 className="font-heading font-bold text-lg text-blue-900">Historical Context</h3>
 </div>

 <blockquote className="relative p-4 bg-amber-50 rounded-xl border border-amber-100 mb-4">
 <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-xl opacity-50" />
 <p className="text-sm text-blue-900/80 italic leading-relaxed font-serif">
 "The soul is eternal, immutable, and the path to liberation
 lies through the realization of the Divine presence in all
 living beings."
 </p>
 </blockquote>

 <p className="text-sm text-gray-600 leading-relaxed">
 {video.contextNotes.historicalContext}
 </p>
 </div>
 )}

 {/* 2. Scriptural Insights */}
 {video.contextNotes?.scripturalInsights &&
 video.contextNotes.scripturalInsights.length > 0 && (
 <div>
 <div className="flex items-center gap-2 mb-3 text-amber-600">
 <BookOpen className="w-5 h-5" />
 <h3 className="font-heading font-bold text-lg text-blue-900">
 Scriptural Insights
 </h3>
 </div>
 <div className="space-y-4">
 {video.contextNotes.scripturalInsights.map(
 (insight, index) => (
 <div key={index} className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm">
 <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider mb-2">
 {insight.title}
 </h4>
 <p className="text-sm text-gray-600 leading-relaxed">
 {insight.content}
 </p>
 </div>
 )
 )}
 </div>
 </div>
 )}

 {/* 3. Geographic Significance */}
 {video.contextNotes?.geographicSignificance && (
 <div>
 <div className="flex items-center gap-2 mb-3 text-amber-600">
 <MapPin className="w-5 h-5" />
 <h3 className="font-heading font-bold text-lg text-blue-900">
 Geographic Significance
 </h3>
 </div>
 <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
 <p className="text-sm text-gray-600 leading-relaxed">
 {video.contextNotes.geographicSignificance}
 </p>
 </div>
 </div>
 )}

 {/* Next Discourse Button */}
 <div className="pt-4 sticky bottom-6">
 <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white h-14 rounded-2xl font-bold uppercase tracking-wider shadow-lg shadow-blue-900/20 flex items-center justify-between px-6 group">
 <span>Next Discourse</span>
 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
 <ChevronLeft className="w-5 h-5 rotate-180" />
 </div>
 </Button>
 </div>
 </div>
 ) : (
 <div className="text-center py-12">
 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Share2 className="w-8 h-8 text-gray-400" />
 </div>
 <p className="text-gray-500">Related media content coming soon...</p>
 </div>
 )}
 </div>
 </div>
 );
}

