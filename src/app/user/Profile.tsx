import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Share2,
  ChevronRight,
  Bookmark,
  CheckCircle,
  HandHeart,
  Settings as SettingsIcon,
  LogOut,
  HelpCircle,
  Pencil,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Progress } from "@/shared/components/ui/progress";
import { useAuth } from "@/auth/AuthContext";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { EditProfileModal } from "./components/EditProfileModal";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, userProfile, profileLoading, signOut } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth/login", { replace: true });
    } catch (error) {
      console.error("❌ [Profile] Logout failed:", error);
    }
  };

  // If loading, show skeleton
  if (profileLoading) {
    return (
      <div className="min-h-full flex-1 flex flex-col p-6 items-center pt-20">
        <Skeleton className="w-32 h-32 rounded-full mb-6" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  // Calculate joined date
  const joinedDate = userProfile?.createdAt 
    ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(userProfile.createdAt.toDate())
    : "Recently";

  // Calculate completion percentage
  const fields = ['firstName', 'lastName', 'profileImage', 'bio', 'city', 'district', 'state', 'whatsapp', 'username'];
  const filledFields = fields.filter(f => !!(userProfile as any)?.[f]);
  const completionPercentage = Math.round((filledFields.length / fields.length) * 100);

  return (
    <div className="min-h-full flex-1 font-sans bg-gray-50/50 pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 hover:bg-black/5"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-7 h-7 text-[#0f3c6e]" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0f3c6e] font-serif">
          {t("profile.title")}
        </h1>
        <Button variant="ghost" size="icon" className="-mr-2 hover:bg-black/5">
          <Share2 className="w-6 h-6 text-[#0f3c6e]" />
        </Button>
      </div>

      {/* Profile Section */}
      <div className="px-6 py-8 flex flex-col items-center bg-white border-b border-gray-100">
        {/* Avatar with Verified Badge */}
        <div className="relative mb-4">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
            {userProfile?.profileImage ? (
               <img
                 src={userProfile.profileImage}
                 alt={userProfile.displayName}
                 className="w-full h-full object-cover"
               />
            ) : (
               <UserIcon className="w-16 h-16 text-white/80" />
            )}
          </div>

          {/* Verified Badge */}
          {userProfile?.role !== 'user' && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1 border border-gray-200 flex items-center gap-1 shadow-sm whitespace-nowrap">
              <CheckCircle className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
                {userProfile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          )}
        </div>

        {/* User Name and Join Date */}
        <h2 className="text-2xl font-heading font-bold text-[#0f3c6e] mt-6 mb-1 text-center">
          {userProfile?.displayName || "Sthana Vasi"}
        </h2>
        {userProfile?.username && (
           <p className="text-sm font-medium text-blue-600 mb-1">@{userProfile.username}</p>
        )}
        <p className="text-sm text-gray-500">
          {t("profile.explorerSince")} {joinedDate}
        </p>

        {/* Edit Button */}
        <Button 
          variant="outline" 
          className="mt-6 gap-2 rounded-full border-gray-300 shadow-sm"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </Button>

        {/* Profile Completion Bar */}
        {completionPercentage < 100 && (
          <div className="w-full max-w-xs mt-8">
            <div className="flex justify-between text-xs mb-2 font-medium text-gray-600">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2 bg-gray-100" />
          </div>
        )}
        
        {userProfile?.bio && (
           <p className="mt-8 text-center text-sm text-gray-600 max-w-md italic">"{userProfile.bio}"</p>
        )}

      </div>

      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        {/* Spiritual Journey Section */}
        <div className="px-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0f3c6e]">
            {t("profile.spiritualJourney")}
          </h3>

          <Card
            className="mb-3 p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer shadow-sm"
            onClick={() => navigate("/saved")}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-5 h-5 text-[#0f3c6e]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#0f3c6e]">
                  {t("profile.mySavedSthanas")}
                </h4>
                <p className="text-xs text-gray-500">
                  {savedCount} {t("profile.placesBookmarked")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500" />
            </div>
          </Card>

          <Card
            className="p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer shadow-sm"
            onClick={() => navigate("/raj-viharan")}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-[#0f3c6e]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#0f3c6e]">
                  {t("profile.completedYatras")}
                </h4>
                <p className="text-xs text-gray-500">
                  Track your spiritual journeys
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500" />
            </div>
          </Card>
        </div>

        {/* Seva & Support Section */}
        <div className="px-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0f3c6e]">
            {t("profile.sevaSupport")}
          </h3>

          <Card
            className="p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer shadow-sm"
            onClick={() => navigate("/donations")}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <HandHeart className="w-5 h-5 text-[#0f3c6e]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#0f3c6e]">
                  {t("profile.donationHistory")}
                </h4>
                <p className="text-xs text-gray-500">
                  {t("profile.donationHistoryDesc")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500" />
            </div>
          </Card>

          <Card
            className="mt-3 p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer shadow-sm"
            onClick={() => navigate("/help-center")}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-[#0f3c6e]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#0f3c6e]">
                  {t("profile.helpCenter")}
                </h4>
                <p className="text-xs text-gray-500">
                  {t("profile.helpCenterDesc")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500" />
            </div>
          </Card>
        </div>

        {/* Preferences Section */}
        <div className="px-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0f3c6e]">
            {t("profile.preferences")}
          </h3>

          <Card
            className="p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer shadow-sm"
            onClick={() => navigate("/settings")}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="w-5 h-5 text-[#0f3c6e]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#0f3c6e]">
                  {t("common.settings")}
                </h4>
                <p className="text-xs text-gray-500">
                  {t("profile.settingsDesc")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500" />
            </div>
          </Card>
        </div>

        {/* Log Out Button */}
        <div className="px-6 pb-6">
          <Card
            className="p-4 bg-white border-none rounded-xl hover:shadow-xl transition-shadow cursor-pointer shadow-sm"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-red-500">
                  {t("common.logout")}
                </h4>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <EditProfileModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
      />
    </div>
  );
};

export default Profile;
