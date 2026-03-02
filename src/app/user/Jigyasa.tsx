import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { db } from "@/auth/firebase";
import { collection, onSnapshot, query, limit, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/auth/AuthContext";

interface DailyWisdom {
 id: string;
 question: string;
 questNumber: number;
 difficulty: string;
 category: string;
}

interface KnowledgeSphere {
 id: string;
 title: string;
 icon: string;
 color: string;
 description?: string;
}

interface UserStreak {
 currentStreak: number;
 totalPoints: number;
 level: string;
 progress: number;
 nextLevel: string;
 pointsToNext: number;
}

export default function Jigyasa() {
 const navigate = useNavigate();
 const { user } = useAuth();
 const [dailyWisdom, setDailyWisdom] = useState<DailyWisdom | null>(null);
 const [knowledgeSpheres, setKnowledgeSpheres] = useState<KnowledgeSphere[]>([]);
 const [userStreak, setUserStreak] = useState<UserStreak>({
 currentStreak: 7,
 totalPoints: 280,
 level: "Seeker of Truth",
 progress: 72,
 nextLevel: "Legend",
 pointsToNext: 110,
 });

 // Fetch daily wisdom
 useEffect(() => {
 const q = query(collection(db, "dailyWisdom"), limit(1));
 const unsubscribe = onSnapshot(q, (snapshot) => {
 if (!snapshot.empty) {
 const wisdom = {
 id: snapshot.docs[0].id,
 ...snapshot.docs[0].data(),
 } as DailyWisdom;
 setDailyWisdom(wisdom);
 }
 });
 return () => unsubscribe();
 }, []);

 // Fetch knowledge spheres
 useEffect(() => {
 const unsubscribe = onSnapshot(collection(db, "knowledgeSpheres"), (snapshot) => {
 const spheres = snapshot.docs.map((doc) => ({
 id: doc.id,
 ...doc.data(),
 })) as KnowledgeSphere[];
 setKnowledgeSpheres(spheres);
 });
 return () => unsubscribe();
 }, []);

 // Fetch user streak data
 useEffect(() => {
 if (!user) return;

 const fetchStreak = async () => {
 try {
 const streakDoc = await getDoc(doc(db, `users/${user.uid}/streakData/current`));
 if (streakDoc.exists()) {
 setUserStreak(streakDoc.data() as UserStreak);
 }
 } catch (error) {
 console.error("Error fetching streak:", error);
 }
 };

 fetchStreak();
 }, [user]);

 const defaultSpheres: KnowledgeSphere[] = [
 {
 id: "1",
 title: "Temple Vastu",
 icon: "🏛️",
 color: "from-blue-900 to-blue-700",
 },
 {
 id: "2",
 title: "Scriptural History",
 icon: "📖",
 color: "from-blue-900 to-blue-700",
 },
 {
 id: "3",
 title: "Ancient Art",
 icon: "🎨",
 color: "from-blue-900 to-blue-700",
 },
 {
 id: "4",
 title: "Vedic Science",
 icon: "📚",
 color: "from-blue-900 to-blue-700",
 },
 ];

 const displaySpheres = knowledgeSpheres.length > 0 ? knowledgeSpheres : defaultSpheres;

 return (
 <div className="min-h-full flex-1 lg:">
 {/* Header */}
 {/* Header */}
 <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between /95 lg:/95 backdrop-blur-sm">
 <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5" onClick={() => navigate(-1)}>
 <ChevronLeft className="w-7 h-7 text-blue-900" />
 </Button>
 <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0f3c6e] font-serif">Jigyasa</h1>
 <Button variant="ghost" size="icon" className="-mr-2 hover:bg-black/5">
 <HelpCircle className="w-6 h-6 text-blue-900" />
 </Button>
 </div>

 {/* Content */}
 <div className="px-6 py-6 space-y-6">
 {/* Daily Wisdom Card */}
 <div className="relative bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-6 overflow-hidden">
 {/* Decorative Pattern */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
 <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />

 <div className="relative z-10">
 <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
 Daily Wisdom
 </p>

 {dailyWisdom ? (
 <>
 <h2 className="text-amber-300 text-xl font-serif italic leading-relaxed mb-4">
 "{dailyWisdom.question}"
 </h2>

 <div className="flex items-center justify-between">
 <div className="text-white/80 text-sm">
 <p className="mb-1">Quest #{dailyWisdom.questNumber}</p>
 <p>Difficulty: {dailyWisdom.difficulty}</p>
 </div>

 <Button className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-bold rounded-full px-6 h-11">
 Answer Now
 <Sparkles className="w-4 h-4 ml-2" />
 </Button>
 </div>
 </>
 ) : (
 <>
 <h2 className="text-amber-300 text-xl font-serif italic leading-relaxed mb-4">
 "What is the cosmic significance of the Nataraja's dance?"
 </h2>

 <div className="flex items-center justify-between">
 <div className="text-white/80 text-sm">
 <p className="mb-1">Quest #142</p>
 <p>Difficulty: Seeker</p>
 </div>

 <Button className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-bold rounded-full px-6 h-11">
 Answer Now
 <Sparkles className="w-4 h-4 ml-2" />
 </Button>
 </div>
 </>
 )}
 </div>
 </div>

 {/* Knowledge Spheres */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-heading font-bold text-xl text-blue-900">
 Knowledge Spheres
 </h2>
 <button className="text-sm font-bold text-blue-600 uppercase tracking-wider">
 Explore All
 </button>
 </div>

 <div className="grid grid-cols-2 gap-4">
 {displaySpheres.map((sphere) => (
 <button
 key={sphere.id}
 onClick={() => navigate(`/jigyasa/${sphere.id}`)}
 className="group"
 >
 <div className="relative aspect-square">
 {/* Circle */}
 <div className={`absolute inset-0 bg-gradient-to-br ${sphere.color} rounded-full group-hover:scale-105 transition-transform duration-300`}>
 {/* Pattern Overlay */}
 <div className="absolute inset-0 rounded-full opacity-10">
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
 </div>

 {/* Icon */}
 <div className="absolute inset-0 flex items-center justify-center">
 <span className="text-5xl">{sphere.icon}</span>
 </div>
 </div>
 </div>

 <h3 className="mt-3 font-bold text-blue-900 text-sm text-center">
 {sphere.title}
 </h3>
 </button>
 ))}
 </div>
 </div>

 {/* Knowledge Streak */}
 <div className="bg-white rounded-3xl p-6 border border-gray-100">
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
 <Sparkles className="w-5 h-5 text-amber-600" />
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-blue-900 text-lg mb-1">
 Knowledge Streak
 </h3>
 <p className="text-sm text-gray-600">
 {userStreak.currentStreak} Day Path of Wisdom
 </p>
 </div>
 <div className="text-right">
 <p className="text-3xl font-bold text-blue-900">
 {userStreak.progress}%
 </p>
 </div>
 </div>

 {/* Progress Bar */}
 <div className="mb-3">
 <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
 style={{ width: `${userStreak.progress}%` }}
 />
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between text-sm">
 <p className="text-gray-600 italic">
 "You are a {userStreak.level}"
 </p>
 <p className="font-bold text-amber-600">
 {userStreak.pointsToNext}XP to {userStreak.nextLevel}
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
