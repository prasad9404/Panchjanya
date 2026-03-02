import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { useAuth } from "@/auth/AuthContext";
import { collection, query, onSnapshot, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/auth/firebase";

interface SavedTemple {
 id: string;
 templeId: string;
 templeName: string;
 templeCity: string;
 templeImage: string;
 savedAt: any;
}

const Saved = () => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const [savedTemples, setSavedTemples] = useState<SavedTemple[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!user) {
 setLoading(false);
 return;
 }

 const savedTemplesRef = collection(db, `users/${user.uid}/savedTemples`);
 const q = query(savedTemplesRef);

 const unsubscribe = onSnapshot(q, (snapshot) => {
 const temples: SavedTemple[] = [];
 snapshot.forEach((doc) => {
 temples.push({ id: doc.id, ...doc.data() } as SavedTemple);
 });

 // Sort by savedAt (most recent first)
 temples.sort((a, b) => {
 const aTime = a.savedAt?.toDate?.() || new Date(0);
 const bTime = b.savedAt?.toDate?.() || new Date(0);
 return bTime.getTime() - aTime.getTime();
 });

 setSavedTemples(temples);
 setLoading(false);
 });

 return () => unsubscribe();
 }, [user]);

 const handleRemove = async (templeId: string) => {
 if (!user) return;

 try {
 await deleteDoc(doc(db, `users/${user.uid}/savedTemples/${templeId}`));
 } catch (error) {
 console.error("Error removing saved temple:", error);
 }
 };

 const handleTempleClick = (templeId: string) => {
 // Navigate to explore page with the temple selected
 navigate(`/explore?temple=${templeId}`);
 };

 if (!user) {
 return (
 <div className="min-h-full flex-1 font-sans flex items-center justify-center">
 <div className="text-center">
 <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <h2 className="text-xl font-bold text-gray-700 mb-2">Please Log In</h2>
 <p className="text-gray-500">Sign in to view your saved temples</p>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-full flex-1 font-sans">
 {/* Header */}
 {/* Header */}
 <div className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-gray-100">
 <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5" onClick={() => navigate(-1)}>
 <ChevronLeft className="w-7 h-7 text-[#0f3c6e]" />
 </Button>
 <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0f3c6e] font-serif">My Saved Sthanas</h1>
 <div className="w-10" />
 </div>

 {/* Content */}
 <div className="px-6 py-6">
 {loading ? (
 <div className="text-center py-20">
 <p className="text-gray-500">Loading saved temples...</p>
 </div>
 ) : savedTemples.length === 0 ? (
 <div className="text-center py-20">
 <Bookmark className="w-20 h-20 text-gray-300 mx-auto mb-4" />
 <h2 className="text-2xl font-bold text-gray-700 mb-2">No Saved Temples</h2>
 <p className="text-gray-500 mb-6">Start exploring and save your favorite temples</p>
 <Button
 onClick={() => navigate("/explore")}
 className="bg-[#0f3c6e] hover:bg-[#0f3c6e]/90"
 >
 Explore Temples
 </Button>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {savedTemples.map((temple) => (
 <Card
 key={temple.id}
 className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
 >
 <div onClick={() => handleTempleClick(temple.templeId)}>
 <div className="relative aspect-[4/3] overflow-hidden">
 <img
 src={temple.templeImage || "https://placehold.co/400x300?text=Temple"}
 alt={temple.templeName}
 className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
 onError={(e) => {
 (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Temple";
 }}
 />
 <div className="absolute top-2 right-2">
 <div className="bg-amber-500 text-white p-2 rounded-full">
 <Bookmark className="w-4 h-4 fill-current" />
 </div>
 </div>
 </div>
 <div className="p-4">
 <h3 className="font-bold text-[#0f3c6e] text-lg mb-1 line-clamp-2">
 {temple.templeName}
 </h3>
 <p className="text-sm text-gray-500 mb-3 line-clamp-1">
 {temple.templeCity || "Location not specified"}
 </p>
 </div>
 </div>
 <div className="px-4 pb-4">
 <Button
 variant="outline"
 size="sm"
 onClick={(e) => {
 e.stopPropagation();
 handleRemove(temple.templeId);
 }}
 className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Remove
 </Button>
 </div>
 </Card>
 ))}
 </div>
 )}
 </div>
 </div>
 );
};

export default Saved;
