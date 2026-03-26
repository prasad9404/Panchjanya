import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { auth } from '@/auth/firebase';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // Get the ID token and check for custom claims
          const idTokenResult = await currentUser.getIdTokenResult();
          const isUserAdmin = !!idTokenResult.claims.admin;
          const isUserSuperAdmin = !!idTokenResult.claims.superAdmin;

          console.log(
            `👤 %cAuth State Change: ${currentUser.email}`, 
            "color: #3b82f6; font-weight: bold;",
            `(Admin: ${isUserAdmin}, Super: ${isUserSuperAdmin})`
          );
          console.log("🔑 ID Token Claims:", JSON.stringify(idTokenResult.claims, null, 2));

          // Fallback check if VITE_ADMIN_EMAIL or VITE_SUPER_ADMIN_EMAIL is set
          const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
          const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;

          if (!isUserSuperAdmin && superAdminEmail && currentUser.email === superAdminEmail) {
            console.warn("⚠️ Custom claim 'superAdmin' missing, but email matches VITE_SUPER_ADMIN_EMAIL.");
            setIsSuperAdmin(true);
            setIsAdmin(true);
          } else {
            setIsSuperAdmin(isUserSuperAdmin);
            
            if (!isUserAdmin && adminEmail && currentUser.email === adminEmail) {
              console.warn("⚠️ Custom claim 'admin' missing, but email matches VITE_ADMIN_EMAIL.");
              setIsAdmin(true);
            } else {
              setIsAdmin(isUserAdmin || isUserSuperAdmin); // Super admin is also an admin
            }
          }
        } catch (error) {
          console.error("Error checking admin claims:", error);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName) {
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    navigate('/');
  };

  const refreshToken = async () => {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true); // Force refresh
      console.log('🔄 Token refreshed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshToken, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
