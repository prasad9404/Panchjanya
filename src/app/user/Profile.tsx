import { useNavigate } from "react-router-dom";
import { ChevronLeft, Share2, ChevronRight, Bookmark, CheckCircle, HandHeart, Settings as SettingsIcon, LogOut, HelpCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { useAuth } from "@/auth/AuthContext";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/auth/firebase";

const Profile = () => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const [savedCount, setSavedCount] = useState(0);

 // Get real-time count of saved temples
 useEffect(() => {
 if (!user) {
 setSavedCount(0);
 return;
 }

 const savedTemplesRef = collection(db, `users/${user.uid}/savedTemples`);
 const q = query(savedTemplesRef);

 const unsubscribe = onSnapshot(q, (snapshot) => {
 setSavedCount(snapshot.size);
 });

 return () => unsubscribe();
 }, [user]);

 // Mock user data - replace with actual user data from context/auth
 const userData = {
 name: user?.displayName || "Aditya Vardhan",
 joinDate: "Oct 2023",
 avatar: user?.photoURL || "/placeholder-avatar.jpg",
 isVerified: true,
 stats: {
 sthanas: 12,
 yatras: 4,
 karma: "3k"
 },
 completedYatras: ["Kashi", "Ayodhya"]
 };

 const handleLogout = () => {
 // Implement logout logic
 console.log("Logging out...");
 navigate("/");
 };

 return (
 <div className="min-h-full flex-1 font-sans">
 {/* Header */}
 {/* Header */}
 <div className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-gray-100">
 <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5" onClick={() => navigate(-1)}>
 <ChevronLeft className="w-7 h-7 text-[#0f3c6e]" />
 </Button>
 <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0f3c6e] font-serif">Member Profile</h1>
 <Button variant="ghost" size="icon" className="-mr-2 hover:bg-black/5">
 <Share2 className="w-6 h-6 text-[#0f3c6e]" />
 </Button>
 </div>

 {/* Profile Section */}
 <div className="px-6 py-8 flex flex-col items-center">
 {/* Avatar with Verified Badge */}
 <div className="relative mb-4">
 <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden border-4 border-white">
 <img
 src={userData.avatar}
 alt={userData.name}
 className="w-full h-full object-cover"
 onError={(e) => {
 (e.target as HTMLImageElement).style.display = 'none';
 }}
 />
 <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold">
 {userData.name.charAt(0)}
 </div>
 </div>

 {/* Verified Badge */}
 {userData.isVerified && (
 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1 border border-gray-200 flex items-center gap-1">
 <CheckCircle className="w-4 h-4 text-amber-500 fill-amber-500" />
 <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Verified</span>
 </div>
 )}
 </div>

 {/* User Name and Join Date */}
 <h2 className="text-2xl font-heading font-bold text-[#0f3c6e] mt-6 mb-1">{userData.name}</h2>
 <p className="text-sm text-gray-500">Panchajanya Explorer since {userData.joinDate}</p>

 {/* Stats */}
 <div className="flex items-center gap-12 mt-6">
 <div className="text-center">
 <div className="text-2xl font-bold text-[#0f3c6e]">{userData.stats.sthanas}</div>
 <div className="text-xs text-gray-500 uppercase tracking-wider">Sthanas</div>
 </div>
 <div className="w-px h-10 bg-gray-300"></div>
 <div className="text-center">
 <div className="text-2xl font-bold text-[#0f3c6e]">{userData.stats.yatras}</div>
 <div className="text-xs text-gray-500 uppercase tracking-wider">Yatras</div>
 </div>
 </div>
 </div>

 {/* Spiritual Journey Section */}
 <div className="px-6 mb-6">
 <h3 className="text-sm font-bold text-[#0f3c6e] uppercase tracking-wider mb-3">Spiritual Journey</h3>

 {/* My Saved Sthanas */}
 <Card className="mb-3 p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/saved")}>
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
 <Bookmark className="w-5 h-5 text-[#0f3c6e]" />
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-[#0f3c6e] text-base">My Saved Sthanas</h4>
 <p className="text-xs text-gray-500">{savedCount} sacred places bookmarked</p>
 </div>
 <ChevronRight className="w-5 h-5 text-amber-500" />
 </div>
 </Card>

 {/* Completed Yatras */}
 <Card className="p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/raj-viharan")}>
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
 <CheckCircle className="w-5 h-5 text-[#0f3c6e]" />
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-[#0f3c6e] text-base">Completed Yatras</h4>
 <p className="text-xs text-gray-500">{userData.completedYatras.join(" and ")} completed</p>
 </div>
 <ChevronRight className="w-5 h-5 text-amber-500" />
 </div>
 </Card>
 </div>

 {/* Seva & Support Section */}
 <div className="px-6 mb-6">
 <h3 className="text-sm font-bold text-[#0f3c6e] uppercase tracking-wider mb-3">Seva & Support</h3>

 {/* Donation History */}
 <Card className="p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/donations")}>
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
 <HandHeart className="w-5 h-5 text-[#0f3c6e]" />
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-[#0f3c6e] text-base">Donation History</h4>
 <p className="text-xs text-gray-500">View your contributions to heritage</p>
 </div>
 <ChevronRight className="w-5 h-5 text-amber-500" />
 </div>
 </Card>

 {/* Help Center */}
 <Card className="mt-3 p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/help-center")}>
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
 <HelpCircle className="w-5 h-5 text-[#0f3c6e]" />
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-[#0f3c6e] text-base">Help Center</h4>
 <p className="text-xs text-gray-500">FAQs and Support</p>
 </div>
 <ChevronRight className="w-5 h-5 text-amber-500" />
 </div>
 </Card>
 </div>

 {/* Preferences Section */}
 <div className="px-6 mb-6">
 <h3 className="text-sm font-bold text-[#0f3c6e] uppercase tracking-wider mb-3">Preferences</h3>

 {/* Settings */}
 <Card className="p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/settings")}>
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
 <SettingsIcon className="w-5 h-5 text-[#0f3c6e]" />
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-[#0f3c6e] text-base">Settings</h4>
 <p className="text-xs text-gray-500">Notifications, security, and privacy</p>
 </div>
 <ChevronRight className="w-5 h-5 text-amber-500" />
 </div>
 </Card>
 </div>

 {/* Log Out Button */}
 <div className="px-6">
 <Card className="p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer" onClick={handleLogout}>
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
 <LogOut className="w-5 h-5 text-red-500" />
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-red-500 text-base">Log Out</h4>
 </div>
 </div>
 </Card>
 </div>
 </div>
 );
};

export default Profile;
