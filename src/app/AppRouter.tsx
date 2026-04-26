import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { PageLoader } from "@/shared/components/ui/PageLoader";
import { ErrorBoundary } from "@/shared/components/layout/ErrorBoundary";
import { AuthProvider } from "../auth/AuthContext";
import { LanguageProvider } from "../shared/contexts/LanguageContext";
import { ThemeProvider } from "../shared/contexts/ThemeContext";
import { SthanTypesProvider } from "../shared/contexts/SthanTypesContext";
import { checkForUpdate } from "@/utils/checkUpdate";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

import PrivateRoute from "@/shared/components/auth/PrivateRoute";

// Layout
const Layout = lazy(() => import("../shared/components/layout/Layout"));

// User Pages
const Dashboard = lazy(() => import("./user/Dashboard"));
const About = lazy(() => import("./public/About"));
const Share = lazy(() => import("./public/Share"));
const Explore = lazy(() => import("./user/Explore"));
const Settings = lazy(() => import("./user/Settings"));
const NotFound = lazy(() => import("./public/NotFound"));

const TempleArchitecture = lazy(() => import("@/app/user/TempleArchitecture"));
const ArchitectureViewer = lazy(() => import("@/app/user/ArchitectureViewer"));
const SthanaVandan = lazy(() => import("@/app/user/SthanaVandan"));
const SwamiYatra = lazy(() => import("@/app/user/SwamiYatra"));
const Profile = lazy(() => import("@/app/user/Profile"));
const Saved = lazy(() => import("@/app/user/Saved"));
const Literature = lazy(() => import("@/app/user/Literature"));
const SthanaDetail = lazy(() => import("@/app/user/SthanaDetail"));
const AudioPlayer = lazy(() => import("@/app/user/AudioPlayer"));
const VideoPlayer = lazy(() => import("@/app/user/VideoPlayer"));
const VandanHistory = lazy(() => import("@/app/user/VandanHistory"));
const WhatsNew = lazy(() => import("@/app/user/WhatsNew"));
const Jigyasa = lazy(() => import("@/app/user/Jigyasa"));
const ELibrary = lazy(() => import("@/app/user/ELibrary"));
const HelpCenter = lazy(() => import("@/app/public/HelpCenter"));

// Admin Pages
const AdminLogin = lazy(() => import("@/app/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("@/app/admin/AdminDashboard"));
const SthanaDirectory = lazy(() => import("@/app/admin/SthanaDirectory"));
const SthanaVerification = lazy(() => import("@/app/admin/SthanaVerification"));
const ManageSthana = lazy(() => import("@/app/admin/ManageSthana"));

const AdminAddTemple = lazy(() => import("@/app/admin/AdminAddTemple"));
const AdminCsvImport = lazy(() => import("@/app/admin/AdminCsvImport"));
const AdminCsvUpload = lazy(() => import("./admin/AdminCsvUpload"));
const TempleArchitectureAdmin = lazy(() => import("@/app/admin/TempleArchitectureAdmin"));
const ManageYatra = lazy(() => import("@/app/admin/ManageYatra"));
const RajViharanAdmin = lazy(() => import("@/app/admin/RajViharanAdmin"));
const AbbreviationsManager = lazy(() => import("@/app/admin/AbbreviationsManager"));
const SuperAdminDashboard = lazy(() => import("@/app/super-admin/SuperAdminDashboard"));
const UserManagement = lazy(() => import("@/app/super-admin/UserManagement"));
const AdminManagement = lazy(() => import("@/app/super-admin/AdminManagement"));
const ActivityLogs = lazy(() => import("@/app/super-admin/ActivityLogs"));

const MultiStepFormDemo = lazy(() => import("@/app/demo/MultiStepFormDemo"));
const DashboardDemo = lazy(() => import("@/app/demo/DashboardDemo"));
const FormLayoutDemo = lazy(() => import("@/app/demo/FormLayoutDemo"));

// User Auth Flow (Frontend Only)
const UserSplash = lazy(() => import("@/app/auth/UserSplash"));
const UserLanguage = lazy(() => import("@/app/auth/UserLanguage"));
const UserAuthWelcome = lazy(() => import("@/app/auth/UserAuthWelcome"));
const UserLogin = lazy(() => import("@/app/auth/UserLogin"));
const UserRegister = lazy(() => import("@/app/auth/UserRegister"));
const UserOnboarding = lazy(() => import("@/app/auth/UserOnboarding"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Reduce redundant background requests
      retry: 1, // Minimize wait on failures
    },
  },
});

const App = () => {
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkForUpdate();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <WifiOff className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2 font-serif">Connection Lost</h1>
        <p className="text-slate-600 mb-8 max-w-xs">
          Panchajanya requires an active internet connection to deliver the latest sacred temple insights.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-blue-900 hover:bg-blue-800 text-white gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <SthanTypesProvider>
                    <Routes>
                      {/* ---------------------- USER AUTH (FRONTEND ONLY DEMO) ---------------------- */}
                      <Route path="/" element={<UserSplash />} />
                      <Route path="/auth/splash" element={<UserSplash />} />
                      <Route path="/auth/language" element={<UserLanguage />} />
                      <Route path="/auth/welcome" element={<UserAuthWelcome />} />
                      <Route path="/auth/login" element={<UserLogin />} />
                      <Route path="/auth/register" element={<UserRegister />} />
                      <Route path="/auth/onboarding" element={<UserOnboarding />} />

                      {/* ---------------------- ADMIN AUTH ---------------------- */}
                      <Route path="/admin/login" element={<AdminLogin />} />

                      {/* ---------------------- ADMIN PROTECTED ROUTES ---------------------- */}
                      <Route
                        path="/admin"
                        element={
                          <PrivateRoute adminRequired={true} >
                            <AdminDashboard />
                          </PrivateRoute>
                        }
                      />

                      <Route path="/admin/dashboard" element={
                        <PrivateRoute adminRequired={true} >
                          <AdminDashboard />
                        </PrivateRoute>
                      }
                      />

                      <Route path="/admin/sthana-directory" element={
                        <PrivateRoute adminRequired={true} >
                          <SthanaDirectory />
                        </PrivateRoute>
                      }
                      />

                      <Route path="/admin/sthana-verification" element={
                        <PrivateRoute adminRequired={true} >
                          <SthanaVerification />
                        </PrivateRoute>
                      }
                      />

                      <Route
                        path="/admin/temples/add"
                        element={
                          <PrivateRoute adminRequired={true} >
                            <AdminAddTemple />
                          </PrivateRoute>
                        }
                      />

                      <Route
                        path="/admin/temples/:id/edit"
                        element={
                          <PrivateRoute adminRequired={true} >
                            <ManageSthana />
                          </PrivateRoute>
                        }
                      />

                      <Route
                        path="/admin/sthans/add"
                        element={
                          <PrivateRoute adminRequired={true} >
                            <AdminAddTemple />
                          </PrivateRoute>
                        }
                      />


                      <Route
                        path="/admin/csv-import"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <AdminCsvImport />
                          </PrivateRoute>
                        }
                      />

                      <Route
                        path="/admin/manage-yatra"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <ManageYatra />
                          </PrivateRoute>
                        }
                      />

                      <Route
                        path="/admin/raj-viharan"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <RajViharanAdmin />
                          </PrivateRoute>
                        }
                      />

                      <Route
                        path="/admin/abbreviations"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <AbbreviationsManager />
                          </PrivateRoute>
                        }
                      />

                      <Route
                        path="/admin/csv-upload"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <AdminCsvUpload />
                          </PrivateRoute>
                        }
                      />

                      {/* ---------------------- USER ROUTES WITH LAYOUT ---------------------- */}
                      <Route element={<Layout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/dashboard/sthana-vandan" element={<SthanaVandan />} />
                        <Route path="/raj-viharan" element={<SwamiYatra />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/share" element={<Share />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/saved" element={<Saved />} />
                        <Route path="/literature" element={<Literature />} />
                        <Route path="/vandan-history" element={<VandanHistory />} />
                        <Route path="/whats-new" element={<WhatsNew />} />
                        <Route path="/jigyasa" element={<Jigyasa />} />
                        <Route path="/e-library" element={<ELibrary />} />
                        <Route path="/help-center" element={<HelpCenter />} />
                      </Route>

                      {/* ---------------------- MEDIA PLAYERS (FULLSCREEN) ---------------------- */}
                      <Route path="/audio/:id" element={<AudioPlayer />} />
                      <Route path="/video/:id" element={<VideoPlayer />} />

                      {/* ---------------------- TEMPLE ARCHITECTURE (USER) ---------------------- */}
                      <Route path="/temple/:id/architecture" element={<TempleArchitecture />} />
                      <Route path="/temple/:id/architecture-view" element={<ArchitectureViewer />} />
                      <Route path="/temple/:id/architecture/sthana/:sthanaId" element={<SthanaDetail />} />

                      {/* ---------------------- ADMIN ARCHITECTURE ---------------------- */}
                      <Route
                        path="/admin/architecture/:id"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <ManageSthana />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/admin/temples/:id/edit"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <ManageSthana />
                          </PrivateRoute>
                        }
                      />

                      <Route
                        path="/admin/demo/multistep"
                        element={<MultiStepFormDemo />}
                      />
                      <Route
                        path="/admin/demo/dashboard"
                        element={<DashboardDemo />}
                      />

                      <Route
                        path="/admin/demo/form-layout"
                        element={<FormLayoutDemo />}
                      />

                      {/* ---------------------- SUPER ADMIN ROUTES ---------------------- */}
                      <Route
                        path="/super-admin"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <SuperAdminDashboard />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/super-admin/users"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <UserManagement />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/super-admin/admins"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <AdminManagement />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/super-admin/verification"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <SthanaVerification isSuperAdmin={true} />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/super-admin/logs"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <ActivityLogs />
                          </PrivateRoute>
                        }
                      />

                      {/* ---------------------- 404 ---------------------- */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </SthanTypesProvider>
                  </Suspense>
                </ErrorBoundary>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
