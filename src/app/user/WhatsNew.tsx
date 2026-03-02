import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { db } from "@/auth/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

interface FeaturedItem {
 id: string;
 title: string;
 subtitle: string;
 imageUrl: string;
 link?: string;
}

interface Notification {
 id: string;
 type: "temple" | "yatra" | "insight" | "achievement";
 title: string;
 description: string;
 timestamp: Date;
 actionText: string;
 actionLink?: string;
 icon: string;
}

export default function WhatsNew() {
 const navigate = useNavigate();
 const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
 const [notifications, setNotifications] = useState<Notification[]>([]);

 // Fetch featured items
 useEffect(() => {
 const q = query(collection(db, "featuredContent"), limit(5));
 const unsubscribe = onSnapshot(q, (snapshot) => {
 const items = snapshot.docs.map((doc) => ({
 id: doc.id,
 ...doc.data(),
 })) as FeaturedItem[];
 setFeaturedItems(items);
 });
 return () => unsubscribe();
 }, []);

 // Fetch notifications
 useEffect(() => {
 const q = query(
 collection(db, "notifications"),
 orderBy("timestamp", "desc"),
 limit(10)
 );
 const unsubscribe = onSnapshot(q, (snapshot) => {
 const notifs = snapshot.docs.map((doc) => ({
 id: doc.id,
 ...doc.data(),
 timestamp: doc.data().timestamp?.toDate() || new Date(),
 })) as Notification[];
 setNotifications(notifs);
 });
 return () => unsubscribe();
 }, []);

 const getTimeAgo = (date: Date) => {
 const now = new Date();
 const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

 if (diffInHours < 1) return "Just now";
 if (diffInHours < 24) return `${diffInHours} hours ago`;

 const diffInDays = Math.floor(diffInHours / 24);
 if (diffInDays === 1) return "1 day ago";
 if (diffInDays < 7) return `${diffInDays} days ago`;

 return date.toLocaleDateString();
 };

 const getNotificationIcon = (type: string) => {
 switch (type) {
 case "temple":
 return "🏛️";
 case "yatra":
 return "📅";
 case "insight":
 return "📚";
 case "achievement":
 return "🏆";
 default:
 return "📢";
 }
 };

 const getNotificationColor = (type: string) => {
 switch (type) {
 case "temple":
 return "bg-blue-50 text-blue-600";
 case "yatra":
 return "bg-purple-50 text-purple-600";
 case "insight":
 return "bg-amber-50 text-amber-600";
 case "achievement":
 return "bg-green-50 text-green-600";
 default:
 return "bg-gray-50 text-gray-600";
 }
 };

 return (
 <div className="min-h-full flex-1 lg:">
 {/* Header */}
 {/* Header */}
 <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between /95 lg:/95 backdrop-blur-sm">
 <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5" onClick={() => navigate(-1)}>
 <ChevronLeft className="w-7 h-7 text-blue-900" />
 </Button>
 <h1 className="text-xl font-heading font-bold text-blue-900 font-serif">Panchajanya</h1>
 <Button variant="ghost" size="icon" className="-mr-2 hover:bg-black/5 relative">
 <Bell className="w-6 h-6 text-blue-900" />
 <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
 </Button>
 </div>

 {/* Content */}
 <div className="px-6 py-6">
 {/* Featured Section */}
 <div className="mb-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-heading font-bold text-xl text-blue-900">
 Featured
 </h2>
 <button className="text-sm font-bold text-amber-600 uppercase tracking-wider">
 See All
 </button>
 </div>

 {/* Featured Carousel */}
 <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
 {featuredItems.length > 0 ? (
 featuredItems.map((item) => (
 <div
 key={item.id}
 className="relative flex-shrink-0 w-[280px] h-[320px] rounded-2xl overflow-hidden cursor-pointer group"
 onClick={() => item.link && navigate(item.link)}
 >
 <img
 src={item.imageUrl}
 alt={item.title}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
 onError={(e) => {
 (e.target as HTMLImageElement).src =
 "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E";
 }}
 />
 {/* Gradient Overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

 {/* Content */}
 <div className="absolute bottom-0 left-0 right-0 p-5">
 <div className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
 NOW OPEN
 </div>
 <h3 className="font-heading font-bold text-white text-lg mb-1">
 {item.title}
 </h3>
 <p className="text-white/90 text-sm">
 {item.subtitle}
 </p>
 </div>
 </div>
 ))
 ) : (
 <div className="relative flex-shrink-0 w-[280px] h-[320px] rounded-2xl overflow-hidden bg-gray-200">
 <div className="absolute inset-0 flex items-center justify-center text-gray-400">
 No featured content
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Notifications Section */}
 <div>
 <h2 className="font-heading font-bold text-xl text-blue-900 mb-4">
 Notifications
 </h2>

 <div className="space-y-3">
 {notifications.length > 0 ? (
 notifications.map((notification) => (
 <div
 key={notification.id}
 className="bg-white rounded-2xl p-4 border border-gray-100 transition-shadow"
 >
 <div className="flex gap-4">
 {/* Icon */}
 <div
 className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${getNotificationColor(
 notification.type
 )}`}
 >
 {getNotificationIcon(notification.type)}
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2 mb-1">
 <h3 className="font-bold text-blue-900 text-sm">
 {notification.title}
 </h3>
 <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
 </div>

 <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
 {getTimeAgo(notification.timestamp)}
 </p>

 <p className="text-sm text-gray-700 leading-relaxed mb-3">
 {notification.description}
 </p>

 <button
 onClick={() =>
 notification.actionLink && navigate(notification.actionLink)
 }
 className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
 >
 {notification.actionText}
 <svg
 className="w-4 h-4"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M9 5l7 7-7 7"
 />
 </svg>
 </button>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Bell className="w-8 h-8 text-gray-400" />
 </div>
 <p className="text-gray-500 mb-2">No notifications yet</p>
 <p className="text-sm text-gray-400">
 Check back later for updates
 </p>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Floating Action Button */}
 <button className="fixed bottom-24 right-6 w-14 h-14 bg-blue-900 hover:bg-blue-800 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 z-20">
 <Plus className="w-6 h-6" />
 </button>
 </div>
 );
}
