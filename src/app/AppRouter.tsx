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
import { useCapacitorApp } from "@/hooks/useCapacitorApp";
import { Network } from '@capacitor/network';

import { useRootDetection } from "@/hooks/useRootDetection";
import { useSecurity } from "@/hooks/useSecurity";
import { ProtectedContent } from "@/components/ProtectedContent";
import { useAuth } from "../auth/AuthContext";

const CapacitorHandler = () => {
  const { user, isAdmin } = useAuth();
  useCapacitorApp();
  useRootDetection();
  useSecurity(user, isAdmin);
  return null;
};

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
const Blocked = lazy(() => import("@/pages/Blocked"));

const TempleArchitecture = lazy(() => import("@/app/user/TempleArchitecture"));
const ArchitectureViewer = lazy(() => import("@/app/user/ArchitectureViewer"));
const SthanaVandan = lazy(() => import("@/app/user/SthanaVandan"));
const SwamiYatra = lazy(() => import("@/app/user/SwamiYatra"));
const Profile = lazy(() => import("@/app/user/Profile"));
const Saved = lazy(() => import("@/app/user/Saved"));
const Literature = lazy(() => import("@/app/user/Literature"));
const SthanaDetail = lazy(() => import("@/app/user/SthanaDetail"));
const ArchivalArchiveLanding = lazy(() => import("@/app/user/ArchivalArchiveLanding"));
const ArchiveDetail = lazy(() => import("@/app/user/ArchiveDetail"));

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
const ArchivalArchiveAdmin = lazy(() => import("@/app/admin/ArchivalArchiveAdmin"));
const ArchiveEntryAdmin = lazy(() => import("@/app/admin/ArchiveEntryAdmin"));
const ArchiveEntryEdit = lazy(() => import("@/app/admin/ArchiveEntryEdit"));
const ManageYatra = lazy(() => import("@/app/admin/ManageYatra"));
const RajViharanAdmin = lazy(() => import("@/app/admin/RajViharanAdmin"));
const AbbreviationsManager = lazy(() => import("@/app/admin/AbbreviationsManager"));
const SuperAdminDashboard = lazy(() => import("@/app/super-admin/SuperAdminDashboard"));
const UserManagement = lazy(() => import("@/app/admin/UserManagement"));
const AdminManagement = lazy(() => import("@/app/super-admin/AdminManagement"));
const ActivityLogs = lazy(() => import("@/app/super-admin/ActivityLogs"));

const MultiStepFormDemo = lazy(() => import("@/app/demo/MultiStepFormDemo"));
const DashboardDemo = lazy(() => import("@/app/demo/DashboardDemo"));
const FormLayoutDemo = lazy(() => import("@/app/demo/FormLayoutDemo"));

// User Auth Flow
const UserSplash = lazy(() => import("@/app/auth/UserSplash"));
const UserLanguage = lazy(() => import("@/app/auth/UserLanguage"));
const UserAuthWelcome = lazy(() => import("@/app/auth/UserAuthWelcome"));
const UserLogin = lazy(() => import("@/app/auth/UserLogin"));
const UserRegister = lazy(() => import("@/app/auth/UserRegister"));
const UserVerifyIdentity = lazy(() => import("@/app/auth/UserVerifyIdentity"));
const UserOnboarding = lazy(() => import("@/app/auth/UserOnboarding"));
const UserRecover = lazy(() => import("@/app/auth/UserRecover"));

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
    // Web fallback listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capacitor Network listener
    let networkListener: any = null;
    const setupNetwork = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);

      networkListener = await Network.addListener('networkStatusChange', status => {
        setIsOffline(!status.connected);
      });
    };
    setupNetwork();

    // Initial check
    checkForUpdate();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (networkListener) {
        networkListener.remove();
      }
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
                <CapacitorHandler />
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <SthanTypesProvider>
                    <ProtectedContent>
                    <Routes>
                      {/* ---------------------- USER AUTH (PUBLIC) ---------------------- */}
                      <Route path="/" element={<UserSplash />} />
                      <Route path="/blocked" element={<Blocked />} />
                      <Route path="/auth/splash" element={<UserSplash />} />
                      <Route path="/auth/welcome" element={<UserAuthWelcome />} />
                      <Route path="/auth/login" element={<UserLogin />} />
                      <Route path="/auth/register" element={<UserRegister />} />
                      <Route path="/auth/verify-identity" element={<UserVerifyIdentity />} />
                      <Route path="/auth/recover" element={<UserRecover />} />

                      {/* ---------------------- USER AUTH (PROTECTED - require login) ---------------------- */}
                      <Route path="/auth/language" element={<PrivateRoute><UserLanguage /></PrivateRoute>} />
                      <Route path="/auth/onboarding" element={<PrivateRoute><UserOnboarding /></PrivateRoute>} />

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

                      <Route path="/admin/architectural-archives" element={
                        <PrivateRoute adminRequired={true} >
                          <ArchivalArchiveAdmin />
                        </PrivateRoute>
                      }
                      />

                      <Route path="/admin/architectural-archives/:archiveId" element={
                        <PrivateRoute adminRequired={true} >
                          <ArchiveEntryAdmin />
                        </PrivateRoute>
                      }
                      />

                      <Route path="/admin/architecture-entry/:id/edit" element={
                        <PrivateRoute adminRequired={true} >
                          <ArchiveEntryEdit />
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
                        {/* Truly public pages — no auth needed */}
                        <Route path="/about" element={<About />} />
                        <Route path="/share" element={<Share />} />
                        <Route path="/help-center" element={<HelpCenter />} />

                        {/* Protected user pages — require authentication */}
                        <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/dashboard/sthana-vandan" element={<PrivateRoute><SthanaVandan /></PrivateRoute>} />
                        <Route path="/raj-viharan" element={<PrivateRoute><SwamiYatra /></PrivateRoute>} />
                        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/saved" element={<PrivateRoute><Saved /></PrivateRoute>} />
                        <Route path="/literature" element={<PrivateRoute><Literature /></PrivateRoute>} />
                        <Route path="/vandan-history" element={<PrivateRoute><VandanHistory /></PrivateRoute>} />
                        <Route path="/whats-new" element={<PrivateRoute><WhatsNew /></PrivateRoute>} />
                        <Route path="/jigyasa" element={<PrivateRoute><Jigyasa /></PrivateRoute>} />
                        <Route path="/e-library" element={<PrivateRoute><ELibrary /></PrivateRoute>} />
                      </Route>

                      {/* ---------------------- MEDIA PLAYERS (FULLSCREEN, AUTH REQUIRED) ---------------------- */}
                      <Route path="/audio/:id" element={<PrivateRoute><AudioPlayer /></PrivateRoute>} />
                      <Route path="/video/:id" element={<PrivateRoute><VideoPlayer /></PrivateRoute>} />

                      {/* ---------------------- ARCHIVAL ARCHIVES (AUTH REQUIRED) ---------------------- */}
                      <Route path="/architectural-archives" element={<PrivateRoute><ArchivalArchiveLanding /></PrivateRoute>} />
                      <Route path="/architectural-archive/:id" element={<PrivateRoute><ArchiveDetail /></PrivateRoute>} />
                      <Route path="/architectural-archive/:archiveId/:id/architecture" element={<PrivateRoute><TempleArchitecture /></PrivateRoute>} />
                      <Route path="/architectural-archive/:archiveId/:id/architecture-view" element={<PrivateRoute><ArchitectureViewer /></PrivateRoute>} />

                      {/* ---------------------- TEMPLE ARCHITECTURE (AUTH REQUIRED) ---------------------- */}
                      <Route path="/temple/:id/architecture" element={<PrivateRoute><TempleArchitecture /></PrivateRoute>} />
                      <Route path="/temple/:id/architecture-view" element={<PrivateRoute><ArchitectureViewer /></PrivateRoute>} />
                      <Route path="/temple/:id/architecture/sthana/:sthanaId" element={<PrivateRoute><SthanaDetail /></PrivateRoute>} />

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
                        element={<PrivateRoute adminRequired={true}><MultiStepFormDemo /></PrivateRoute>}
                      />
                      <Route
                        path="/admin/demo/dashboard"
                        element={<PrivateRoute adminRequired={true}><DashboardDemo /></PrivateRoute>}
                      />

                      <Route
                        path="/admin/demo/form-layout"
                        element={<PrivateRoute adminRequired={true}><FormLayoutDemo /></PrivateRoute>}
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
                        path="/admin/users"
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
                    </ProtectedContent>
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
