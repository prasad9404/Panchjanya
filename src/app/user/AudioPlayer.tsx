import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
 ChevronLeft,
 Share2,
 Play,
 Pause,
 SkipBack,
 SkipForward,
 Repeat,
 Shuffle,
 ListMusic,
 Heart,
 FileText,
 ArrowLeftRight
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { db } from "@/auth/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AudioContent {
 id: string;
 title: string;
 category: string;
 duration: string;
 audioUrl: string;
 imageUrl: string;
 lyrics?: string[];
 location?: string;
}

export default function AudioPlayer() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const [audio, setAudio] = useState<AudioContent | null>(null);
 const [isPlaying, setIsPlaying] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const [isShuffled, setIsShuffled] = useState(false);
 const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");
 const audioRef = useRef<HTMLAudioElement>(null);

 // Mock Data Fallback (for development/visualization if ID not found)
 const mockAudio: AudioContent = {
 id: "1",
 title: "Shri Chakradhar Swami Aarti",
 category: "Panchjanya Heritage",
 duration: "05:42",
 location: "PAITHAN, MAHARASHTRA",
 audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Demo URL
 imageUrl: "https://images.unsplash.com/photo-1545562083-c583d9917767?w=600",
 lyrics: [
 "जय जय श्रीचक्रधरा |",
 "त्रिभुवनवंदिता सुकुमारा ||",
 "",
 "भक्तवत्सला दीनानाथा |",
 "चरणी ठेवितो मी माथा || १ ||",
 "",
 "काषायवस्त्रे सुशोभित |",
 "ज्ञानमुद्रा जयाची शोभत ||",
 "",
 "भक्तीभावे आरती गाऊ |",
 "नित्यानंद मनी अनुभवू || २ ||",
 "",
 "परमेश्वर अवतार तुमची स्वये |",
 "मुक्ती मार्ग दाखवी पायी ||",
 "",
 "शरण आलो स्वामी तुम्हासी |",
 "दूर करा भवदुःखासी || ३ ||",
 "",
 "धूप दीप नैवेद्य समर्पण |",
 "भक्तीभावे अंतःकरण ||",
 "",
 "चक्रधर स्वामी तुमची मूर्ती |",
 "नित्याराधी हेची तृप्ती || ४ ||"
 ]
 };

 useEffect(() => {
 // In a real app, we would fetch from DB. For now, using mock if not found or for design.
 // If you actually have data in Firestore, uncomment fetching logic.
 /*
 if (!id) return;
 const fetchAudio = async () => { ... }
 fetchAudio();
 */
 setAudio(mockAudio);
 }, [id]);

 useEffect(() => {
 const audioElement = audioRef.current;
 if (!audioElement) return;

 const updateTime = () => setCurrentTime(audioElement.currentTime);
 const updateDuration = () => setDuration(audioElement.duration);

 audioElement.addEventListener("timeupdate", updateTime);
 audioElement.addEventListener("loadedmetadata", updateDuration);

 return () => {
 audioElement.removeEventListener("timeupdate", updateTime);
 audioElement.removeEventListener("loadedmetadata", updateDuration);
 };
 }, [audio]);

 const togglePlayPause = () => {
 if (audioRef.current) {
 if (isPlaying) {
 audioRef.current.pause();
 } else {
 audioRef.current.play();
 }
 setIsPlaying(!isPlaying);
 }
 };

 const formatTime = (time: number) => {
 const minutes = Math.floor(time / 60);
 const seconds = Math.floor(time % 60);
 return `${minutes.toString().padStart(2, "0")}:${seconds
 .toString()
 .padStart(2, "0")}`;
 };

 const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
 const newTime = parseFloat(e.target.value);
 setCurrentTime(newTime);
 if (audioRef.current) {
 audioRef.current.currentTime = newTime;
 }
 };

 if (!audio) {
 return (
 <div className="min-h-full flex-1 flex items-center justify-center ">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900" />
 </div>
 );
 }

 return (
 <div className="min-h-full flex-1 flex flex-col relative overflow-hidden">
 {/* Decorative Background Blur */}
 <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50 pointer-events-none" />
 <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-amber-100 rounded-full blur-[100px] opacity-50 pointer-events-none" />


 <audio ref={audioRef} src={audio.audioUrl} />

 {/* Header */}
 <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between bg-transparent">
 <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5 rounded-full" onClick={() => navigate(-1)}>
 <ChevronLeft className="w-7 h-7 text-blue-900" />
 </Button>
 <h1 className="text-xl font-heading font-bold text-blue-900 font-serif">Panchjanya Heritage</h1>
 <Button variant="ghost" size="icon" className="-mr-2 hover:bg-black/5 rounded-full">
 <Share2 className="w-6 h-6 text-blue-900" />
 </Button>
 </div>

 {/* Main Content */}
 <div className="flex-1 flex flex-col items-center px-6 z-10 overflow-y-auto no-scrollbar pb-32">

 {/* Circular Album Art */}
 <div className="relative mb-8 mt-2">
 <div className="w-64 h-64 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-[6px] border-white/80">
 {/* Golden Ring Effect */}
 <div className="absolute inset-0 border-4 border-blue-900/10 rounded-full pointer-events-none"></div>
 <img
 src={audio.imageUrl}
 alt={audio.title}
 className="w-full h-full object-cover"
 onError={(e) => {
 (e.target as HTMLImageElement).src =
 "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E";
 }}
 />
 </div>
 </div>

 {/* Title Section */}
 <div className="text-center mb-8">
 <h1 className="font-heading font-bold text-2xl text-amber-600 px-4 leading-tight mb-2">
 {audio.title}
 </h1>
 {audio.location && (
 <div className="flex items-center justify-center gap-1.5 text-blue-900 font-bold uppercase text-[10px] tracking-widest opacity-80">
 <span className="w-1.5 h-1.5 rounded-full bg-blue-900 inline-block" />
 Sthana: {audio.location}
 </div>
 )}
 </div>

 {/* Lyrics / Scrollable Content */}
 {audio.lyrics && audio.lyrics.length > 0 && (
 <div className="w-full max-w-sm text-center mb-8 space-y-3">
 {audio.lyrics.map((line, i) => (
 <p key={i} className={`text-blue-900/80 font-medium ${line === "" ? "h-2" : "text-base"}`}>
 {line}
 </p>
 ))}
 </div>
 )}

 </div>

 {/* Player Controls (Fixed Bottom) */}
 <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] px-8 pb-8 pt-8 z-20">
 {/* Progress Bar */}
 <div className="mb-6 relative">
 <div className="w-full h-1 bg-amber-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-amber-500 rounded-full"
 style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
 />
 </div>
 <input
 type="range"
 min="0"
 max={duration || 0}
 value={currentTime}
 onChange={handleSeek}
 className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
 />
 <div className="flex justify-between text-[10px] font-bold text-blue-900 mt-2">
 <span>{formatTime(currentTime)}</span>
 <span>{formatTime(duration || 342)}</span>
 </div>
 </div>

 {/* Main Controls */}
 <div className="flex items-center justify-center gap-6 mb-8">
 <Button
 variant="ghost"
 size="icon"
 className="text-blue-300 hover:text-blue-600 hover:bg-transparent"
 >
 <ArrowLeftRight className="w-5 h-5 rotate-45" /> {/* Use shuffle or similar icon */}
 </Button>

 <Button
 variant="ghost"
 size="icon"
 onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10 }}
 className="text-blue-900 hover:text-amber-600 hover:bg-transparent"
 >
 <SkipBack className="w-8 h-8 fill-current" />
 </Button>

 <Button
 size="icon"
 onClick={togglePlayPause}
 className="w-16 h-16 rounded-full bg-[#C6A868] hover:bg-[#B59655] shadow-xl shadow-amber-200/50 flex items-center justify-center transition-transform active:scale-95"
 >
 {isPlaying ? (
 <Pause className="w-7 h-7 text-white fill-white" />
 ) : (
 <Play className="w-7 h-7 text-white fill-white ml-1" />
 )}
 </Button>

 <Button
 variant="ghost"
 size="icon"
 onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }}
 className="text-blue-900 hover:text-amber-600 hover:bg-transparent"
 >
 <SkipForward className="w-8 h-8 fill-current" />
 </Button>

 <Button
 variant="ghost"
 size="icon"
 className="text-blue-300 hover:text-blue-600 hover:bg-transparent"
 >
 <Repeat className="w-5 h-5" />
 </Button>
 </div>

 {/* Bottom Actions */}
 <div className="flex justify-between px-6 border-t border-gray-100 pt-4">
 <button className="flex flex-col items-center gap-1.5 text-blue-900/60 hover:text-blue-900 transition-colors">
 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
 <ListMusic className="w-5 h-5" />
 </div>
 <span className="text-[10px] font-bold uppercase tracking-wider">Library</span>
 </button>

 <button className="flex flex-col items-center gap-1.5 text-blue-900 hover:text-blue-900 transition-colors -mt-6">
 <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
 <Heart className="w-6 h-6 fill-blue-900 text-blue-900" />
 </div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Devotion</span>
 </button>

 <button className="flex flex-col items-center gap-1.5 text-blue-900/60 hover:text-blue-900 transition-colors">
 <div className="w-10 h-10 rounded-full bg-[#EFE8D8] flex items-center justify-center">
 <FileText className="w-5 h-5 text-amber-700" />
 </div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Verses</span>
 </button>
 </div>
 </div>
 </div>
 );
}

