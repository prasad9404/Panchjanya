import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/auth/firebase";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/components/ui/card";
import { Lock, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("🔓 Login successful, fetching claims...");
      
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      console.log("🔑 Claims received:", idTokenResult.claims);
      
      const isSuperAdminClaim = !!idTokenResult.claims.superAdmin;
      const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
      const isActuallySuperAdmin = isSuperAdminClaim || (superAdminEmail && userCredential.user.email === superAdminEmail);

      console.log("📊 Role Check:", {
        email: userCredential.user.email,
        isSuperAdminClaim,
        envEmail: superAdminEmail,
        isActuallySuperAdmin
      });

      toast({
        title: "Welcome back",
        description: `Successfully logged in as ${isActuallySuperAdmin ? "Super Admin" : "Admin"}`,
      });

      if (isActuallySuperAdmin) {
        console.log("🚀 Redirecting to /super-admin");
        navigate("/super-admin");
      } else {
        console.log("🚀 Redirecting to /admin/dashboard");
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Restricted access. Authorized personnel only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
