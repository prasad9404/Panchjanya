import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Lock, 
  Mail, 
  Loader2, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck,
  ChevronLeft,
  Eye,
  EyeOff,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { auth } from "@/auth/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

type ViewMode = "login" | "register" | "forgot";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("🔓 Login successful, fetching claims...");
      
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      const isSuperAdminClaim = !!idTokenResult.claims.superAdmin;
      const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
      const isActuallySuperAdmin = isSuperAdminClaim || (superAdminEmail && userCredential.user.email === superAdminEmail);

      toast({
        title: "Welcome back",
        description: `Successfully logged in as ${isActuallySuperAdmin ? "Super Admin" : "Admin"}`,
      });

      if (isActuallySuperAdmin) {
        navigate("/super-admin");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials. Please check your email and password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      
      toast({
        title: "Account Created",
        description: "Your administrative request has been submitted for review.",
      });
      
      setViewMode("login");
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions.",
      });
      setViewMode("login");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#FDFCFB] dark:bg-gray-950 font-[Manrope] transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 dark:bg-orange-500/10 blur-[120px] rounded-full -ml-48 -mb-48" />
      
      {/* Theme Toggle */}
      <div className="absolute top-8 right-8 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-200 dark:border-gray-800"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-500" />}
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10 px-4"
      >
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 bg-white dark:bg-gray-900 rounded-[2rem] flex items-center justify-center p-4 shadow-xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 mb-6"
          >
            <img src="/icons/Main logo.svg" alt="Panchajanya" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-widest mb-2 font-kokila">PANCHAJANYA</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0f3c6e]/5 dark:bg-[#0f3c6e]/20 rounded-full border border-[#0f3c6e]/10 dark:border-[#0f3c6e]/30">
            <ShieldCheck className="w-3 h-3 text-[#0f3c6e] dark:text-blue-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0f3c6e] dark:text-blue-400">Secure Access Console</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-8 md:p-10 shadow-3xl shadow-gray-200/40 dark:shadow-black/60 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Welcome Back</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium italic">Authenticate to continue</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Email Terminal</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <Input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@panchajanya.com"
                        className="bg-gray-50/50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800 h-14 pl-12 rounded-2xl text-gray-900 dark:text-gray-100 focus:ring-[#0f3c6e]/50 focus:border-[#0f3c6e] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Access Key</Label>
                      <button 
                        type="button" 
                        onClick={() => setViewMode("forgot")}
                        className="text-[10px] font-black uppercase tracking-widest text-[#0f3c6e] hover:text-[#0f3c6e]/80 transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-gray-50/50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800 h-14 pl-12 pr-12 rounded-2xl text-gray-900 dark:text-gray-100 focus:ring-[#0f3c6e]/50 focus:border-[#0f3c6e] transition-all font-medium"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-[#0f3c6e] hover:bg-[#0f4c8e] text-white font-black rounded-2xl shadow-xl shadow-[#0f3c6e]/20 group transition-all active:scale-[0.98] border-none"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <span className="flex items-center justify-center gap-2">
                        Initialize Session <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    New personnel? {" "}
                    <button 
                      onClick={() => setViewMode("register")}
                      className="text-[#0f3c6e] font-black hover:text-[#0f4c8e] transition-colors underline decoration-[#0f3c6e]/20 underline-offset-4"
                    >
                      Request Access
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {viewMode === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => setViewMode("login")}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-[#0f3c6e] transition-colors mb-4 group self-start"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
                  </button>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">System Registration</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium italic">Create an administrative profile</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                   <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Full Name</Label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#0f3c6e]" />
                      <Input 
                        type="text" 
                        required 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-gray-50/50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800 h-14 pl-12 rounded-2xl text-gray-900 dark:text-gray-100 focus:ring-[#0f3c6e]/50 focus:border-[#0f3c6e] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Email Terminal</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#0f3c6e]" />
                      <Input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="moderator@panchajanya.com"
                        className="bg-gray-50/50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800 h-14 pl-12 rounded-2xl text-gray-900 dark:text-gray-100 focus:ring-[#0f3c6e]/50 focus:border-[#0f3c6e] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">New Access Key</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#0f3c6e]" />
                      <Input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create strong key"
                        className="bg-gray-50/50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800 h-14 pl-12 rounded-2xl text-gray-900 dark:text-gray-100 focus:ring-[#0f3c6e]/50 focus:border-[#0f3c6e] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-[#0f3c6e] hover:bg-[#0f2c4e] text-white font-black rounded-2xl shadow-xl shadow-[#0f3c6e]/20 transition-all active:scale-[0.98] border-none"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign Up and Request Access"}
                  </Button>
                </form>
              </motion.div>
            )}

            {viewMode === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                 <div className="flex flex-col items-center">
                  <button 
                    onClick={() => setViewMode("login")}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-blue-600 transition-colors mb-4 group self-start"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
                  </button>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight text-center">Recover Access</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium text-center italic">We'll send a reset link to your email</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Recovery Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <Input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="registered@panchajanya.com"
                        className="bg-gray-50/50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800 h-14 pl-12 rounded-2xl text-gray-900 dark:text-gray-100 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-[#0f3c6e] hover:bg-[#0f4c8e] text-white font-black rounded-2xl shadow-xl shadow-[#0f3c6e]/20 transition-all active:scale-[0.98] border-none"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Send Reset Link"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-400 dark:text-gray-500 text-[10px] font-black tracking-[0.3em] uppercase opacity-50">
          V1.32.7 // Secure Protocol // Panchajanya spiritual platform
        </div>
      </motion.div>
    </div>
  );
}
