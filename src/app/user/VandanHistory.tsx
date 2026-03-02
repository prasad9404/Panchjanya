import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Award, CheckCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { db } from "@/auth/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/auth/AuthContext";

interface VandanEntry {
 id: string;
 sthanaName: string;
 location: string;
 timestamp: Date;
 verified: boolean;
 imageUrl: string;
}

export default function VandanHistory() {
 const navigate = useNavigate();
 const { user } = useAuth();
 const [vandanEntries, setVandanEntries] = useState<VandanEntry[]>([]);
 const [totalSalutations, setTotalSalutations] = useState(0);

 useEffect(() => {
 if (!user) return;

 const q = query(
 collection(db, `users/${user.uid}/vandanHistory`),
 orderBy("timestamp", "desc")
 );

 const unsubscribe = onSnapshot(q, (snapshot) => {
 const entries = snapshot.docs.map((doc) => ({
 id: doc.id,
 ...doc.data(),
 timestamp: doc.data().timestamp?.toDate() || new Date(),
 })) as VandanEntry[];

 setVandanEntries(entries);
 setTotalSalutations(entries.length);
 });

 return () => unsubscribe();
 }, [user]);

 const formatDate = (date: Date) => {
 return new Intl.DateTimeFormat("en-IN", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 }).format(date);
 };

 const formatTime = (date: Date) => {
 return new Intl.DateTimeFormat("en-IN", {
 hour: "2-digit",
 minute: "2-digit",
 hour12: true,
 }).format(date);
 };

 if (!user) {
 return (
 <div className="min-h-full flex-1 flex items-center justify-center ">
 <div className="text-center">
 <p className="text-lg text-gray-600 mb-4">Please log in to view your vandan history</p>
 <Button onClick={() => navigate("/login")}>Log In</Button>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-full flex-1 ">
 {/* Header */}
 <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between bg-background/95 /95 backdrop-blur-sm">
 <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5" onClick={() => navigate(-1)}>
 <ChevronLeft className="w-7 h-7 text-[#0f3c6e]" />
 </Button>
 <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0f3c6e] font-serif">Vandan History</h1>
 <div className="w-10" />
 </div>

 {/* Content */}
 <div className="px-6 py-6">
 {/* Total Salutations Card */}
 <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl p-8 border border-amber-100 mb-8 relative overflow-hidden">
 {/* Decorative Background */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16 opacity-50" />
 <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full -ml-12 -mb-12 opacity-50" />

 <div className="relative z-10 text-center">
 <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-3">
 Total Salutations
 </p>
 <h2 className="font-heading font-bold text-6xl text-blue-900 mb-2">
 {totalSalutations}
 </h2>
 <div className="w-16 h-1 bg-amber-500 mx-auto mb-4" />
 <p className="text-gray-600 text-sm italic mb-6">
 Total Sthaan Vandans
 <br />
 Completed in your journey
 </p>
 <Button className="bg-blue-900 hover:bg-blue-800 text-white rounded-full px-8 h-12 font-bold uppercase tracking-wider">
 <Award className="w-5 h-5 mr-2" />
 View Milestones
 </Button>
 </div>
 </div>

 {/* My Spiritual Journey */}
 <div className="mb-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-heading font-bold text-2xl text-blue-900">
 My Spiritual Journey
 </h2>
 <button className="text-amber-600 hover:text-amber-700">
 <svg
 className="w-6 h-6"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
 />
 </svg>
 </button>
 </div>

 {/* Vandan Entries */}
 <div className="space-y-3">
 {vandanEntries.length > 0 ? (
 vandanEntries.map((entry) => (
 <div
 key={entry.id}
 className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-xl transition-shadow"
 >
 <div className="flex items-center gap-4">
 {/* Temple Image */}
 <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
 <img
 src={entry.imageUrl}
 alt={entry.sthanaName}
 className="w-full h-full object-cover"
 onError={(e) => {
 (e.target as HTMLImageElement).src =
 "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E";
 }}
 />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <h3 className="font-bold text-blue-900 text-base mb-1 truncate">
 {entry.sthanaName}
 </h3>
 <div className="flex items-center gap-2 text-xs text-gray-600">
 <svg
 className="w-3 h-3"
 fill="currentColor"
 viewBox="0 0 20 20"
 >
 <path
 fillRule="evenodd"
 d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
 clipRule="evenodd"
 />
 </svg>
 <span>{formatDate(entry.timestamp)}</span>
 <span>•</span>
 <span>{formatTime(entry.timestamp)}</span>
 </div>
 </div>

 {/* Verified Badge */}
 {entry.verified && (
 <div className="flex flex-col items-center gap-1 flex-shrink-0">
 <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
 <CheckCircle className="w-5 h-5 text-white" />
 </div>
 <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
 Verified
 </span>
 </div>
 )}
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Award className="w-8 h-8 text-gray-400" />
 </div>
 <p className="text-gray-500 mb-2">No vandan history yet</p>
 <p className="text-sm text-gray-400">
 Start your spiritual journey today
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
