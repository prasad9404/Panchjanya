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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // Get the ID token and check for custom claims
          const idTokenResult = await currentUser.getIdTokenResult();
          const isUserAdmin = !!idTokenResult.claims.admin;

          console.log(
            `👤 %cAuth State Change: ${currentUser.email}`, 
            "color: #3b82f6; font-weight: bold;",
            `(Admin: ${isUserAdmin})`
          );
          console.log("🔑 ID Token Claims:", JSON.stringify(idTokenResult.claims, null, 2));

          // Fallback check if VITE_ADMIN_EMAIL is set and custom claim is missing
          const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
          if (!isUserAdmin && adminEmail && currentUser.email === adminEmail) {
            console.warn("⚠️ Custom claim 'admin' missing, but email matches VITE_ADMIN_EMAIL. Setting isAdmin to true as fallback.");
            setIsAdmin(true);
          } else {
            setIsAdmin(isUserAdmin);
          }
        } catch (error) {
          console.error("Error checking admin claims:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshToken, isAdmin }}>
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
