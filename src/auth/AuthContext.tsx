/**
 * AuthContext.tsx
 *
 * Central authentication context for the Panchjanya app.
 * Wraps Firebase Auth and provides:
 *  - Real signIn / signUp / signOut
 *  - Firestore user profile loading and caching
 *  - Admin / SuperAdmin role detection via custom claims + env fallback
 *  - Friendly error messages for all Firebase auth error codes
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail,
  deleteUser,
  AuthError,
} from 'firebase/auth';
import { auth, db } from '@/auth/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { authService } from '@/services/authService';
import {
  UserProfile,
  CreateUserProfileData,
  mobileToEmail,
  isValidMobile,
  isStrongPassword,
  checkMobileExists,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  updateLastLogin,
  saveSpiritualProfile,
  SpiritualProfile,
} from '@/auth/userService';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RegistrationData {
  firstName: string;
  lastName: string;
  gender: string;
  age: string;
  state: string;
  district: string;
  taluka: string;
  city: string;
  whatsapp: string;
  mobile: string;
  password: string;
}

interface AuthContextType {
  // Firebase Auth user object
  user: User | null;
  // Full Firestore profile
  userProfile: UserProfile | null;
  // Loading state — true while Firebase is resolving initial auth state
  loading: boolean;
  // Profile loading state — true while Firestore profile is being fetched
  profileLoading: boolean;
  // Role flags
  isAdmin: boolean;
  isSuperAdmin: boolean;
  // Auth operations — all throw descriptive Error messages on failure
  signIn: (mobile: string, password: string) => Promise<void>;
  signUp: (data: RegistrationData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (mobile: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  completeSpiritualOnboarding: (spiritual: SpiritualProfile, language: string) => Promise<void>;
}

// ─── Error Message Mapping ────────────────────────────────────────────────────

function getAuthErrorMessage(error: AuthError | unknown): string {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return 'An unexpected error occurred. Please try again.';
  }
  const code = (error as AuthError).code;
  const messages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this mobile number.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect mobile number or password.',
    'auth/invalid-email': 'Invalid mobile number format.',
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/requires-recent-login': 'Please log in again to continue.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  };
  return messages[code] ?? `Authentication error: ${code}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // ── Listen to Firebase Auth state changes with Real-time Firestore ──────────
  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      if (currentUser) {
        setProfileLoading(true);
        // Attach real-time listener to user document
        profileUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
           if (docSnap.exists()) {
             const profile = docSnap.data() as UserProfile;
             setUserProfile(profile);
             
             // Check claims to match snapshot role
             try {
                const idTokenResult = await currentUser.getIdTokenResult();
                const isUserAdmin = !!idTokenResult.claims.admin;
                const isUserSuperAdmin = !!idTokenResult.claims.superAdmin;
                
                const contextRole = profile.role || 'user';
                const isAdminContext = contextRole === 'admin' || contextRole === 'super_admin';
                
                if (isAdminContext && (isUserAdmin || isUserSuperAdmin)) {
                  setIsSuperAdmin(isUserSuperAdmin || contextRole === 'super_admin');
                  setIsAdmin(true);
                } else {
                  // Env fallback
                  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
                  const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
                  if (!isUserSuperAdmin && superAdminEmail && currentUser.email === superAdminEmail) {
                    setIsSuperAdmin(true);
                    setIsAdmin(true);
                  } else if (!isUserAdmin && adminEmail && currentUser.email === adminEmail) {
                    setIsAdmin(true);
                  } else {
                    setIsAdmin(false);
                    setIsSuperAdmin(false);
                  }
                }
             } catch (error) {
                console.error('❌ [AuthContext] Error checking admin claims:', error);
                setIsAdmin(false);
                setIsSuperAdmin(false);
             }
           } else {
             // Check Env fallback for bootstrapping first admins who don't have a document yet
             const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
             const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
             const isEnvSuperAdmin = superAdminEmail && currentUser.email === superAdminEmail;
             const isEnvAdmin = adminEmail && currentUser.email === adminEmail;

             if (isEnvSuperAdmin || isEnvAdmin) {
                 setUserProfile({ role: isEnvSuperAdmin ? 'super_admin' : 'admin', onboardingComplete: true } as any);
                 setIsSuperAdmin(!!isEnvSuperAdmin);
                 setIsAdmin(true);
             } else {
                 // Document missing or deleted
                 setUserProfile(null);
                 setIsAdmin(false);
                 setIsSuperAdmin(false);
                 authService.forceLogoutAndLock();
             }
           }
           setProfileLoading(false);
        });

      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  // ── Tamper Detection ──────────────────────────────────────────────────
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && (e.key.toLowerCase().includes('role') || e.key.toLowerCase().includes('admin'))) {
        console.warn("Tamper attempt detected in localStorage");
        authService.forceLogoutAndLock();
      }
    };
    
    // Scan immediately on mount
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.toLowerCase().includes('role') || key.toLowerCase().includes('admin'))) {
        authService.forceLogoutAndLock();
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Session Timeout ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 2 hours timeout
      timeoutId = setTimeout(async () => {
        const valid = await authService.verifyAdminAccess();
        if (!valid) {
          authService.forceLogoutAndLock();
        } else {
          resetTimer();
        }
      }, 2 * 60 * 60 * 1000); 
    };

    resetTimer();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isAdmin]);

  // ─── Sign In ────────────────────────────────────────────────────────────────
  const signIn = async (mobile: string, password: string): Promise<void> => {
    if (!mobile || !password) {
      throw new Error('Mobile number and password are required.');
    }
    if (!isValidMobile(mobile)) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    try {
      const email = mobileToEmail(mobile);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // Update last login timestamp (non-blocking)
      updateLastLogin(credential.user.uid).catch(console.error);
      console.log(`✅ [AuthContext] Signed in: ${credential.user.uid}`);
    } catch (error) {
      console.error('❌ [AuthContext] signIn error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  // ─── Sign Up ────────────────────────────────────────────────────────────────
  const signUp = async (data: RegistrationData): Promise<void> => {
    const { mobile, password, firstName, lastName } = data;

    // Client-side validation
    if (!firstName?.trim() || !lastName?.trim()) {
      throw new Error('First name and last name are required.');
    }
    if (!isValidMobile(mobile)) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message);
    }

    // Check for duplicate mobile (Firestore query)
    let mobileExists = false;
    try {
      mobileExists = await checkMobileExists(mobile);
    } catch {
      // Non-critical — proceed; Firestore rules will reject duplicate writes
    }
    if (mobileExists) {
      throw new Error('This email is already registered. Please login instead.');
    }

    try {
      const email = mobileToEmail(mobile);

      // 1. Create Firebase Auth account
      console.info(`[AuthContext] Initiating createUserWithEmailAndPassword for ${email}`);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = credential;
      console.info(`✅ [AuthContext] Firebase Auth account created successfully (UID: ${firebaseUser.uid})`);

      // 2. Prepare profile data
      const profileData: CreateUserProfileData = {
        firstName,
        lastName,
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        mobile,
        whatsapp: data.whatsapp || mobile,
        email,
        gender: data.gender || '',
        age: data.age || '',
        state: data.state || '',
        district: data.district || '',
        taluka: data.taluka || '',
        city: data.city || '',
        preferredLanguage: 'mr',
        onboardingComplete: false,
      };

      // 3. Create Firestore user document FIRST (critical path)
      console.info(`[AuthContext] Initiating Firestore user document creation for UID: ${firebaseUser.uid}`);
      try {
        await createUserProfile(firebaseUser.uid, profileData);
        console.info(`✅ [AuthContext] Firestore user document created successfully for UID: ${firebaseUser.uid}`);
      } catch (profileError) {
        console.error('❌ [AuthContext] Failed to create Firestore profile, rolling back Auth:', profileError);
        await deleteUser(firebaseUser);
        throw new Error('Failed to create user profile. Please try again.');
      }

      // 4. Set display name in Firebase Auth (non-critical, do not block or rollback on failure)
      updateFirebaseProfile(firebaseUser, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      }).then(() => {
        console.info(`✅ [AuthContext] Firebase Auth profile displayName updated.`);
      }).catch(err => {
        console.error(`⚠️ [AuthContext] Non-critical failure updating Auth profile displayName:`, err);
      });

      console.info(`✅ [AuthContext] Registration flow successfully completed for: ${firebaseUser.uid}`);
    } catch (error) {
      console.error('❌ [AuthContext] signUp error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  // ─── Sign Out ───────────────────────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    try {
      // 1. Sign out from Firebase (invalidates session on server)
      await firebaseSignOut(auth);

      // 2. Preserve non-sensitive language preference before clearing storage
      const savedLang = localStorage.getItem('panchajanya_lang');

      // 3. Wipe ALL local and session storage — removes any cached tokens,
      //    user data, and protected page state from the browser
      localStorage.clear();
      sessionStorage.clear();

      // 4. Restore the language preference (not sensitive data)
      if (savedLang) localStorage.setItem('panchajanya_lang', savedLang);

      // 5. Clear React state — ensures no protected data remains in memory
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);

      console.log('✅ [AuthContext] Signed out. Storage cleared.');
      // 6. Hard redirect to login to wipe in-memory query cache and state completely
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('❌ [AuthContext] signOut error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  };

  // ─── Reset Password ─────────────────────────────────────────────────────────
  const resetPassword = async (mobile: string): Promise<void> => {
    if (!isValidMobile(mobile)) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    try {
      const email = mobileToEmail(mobile);
      await sendPasswordResetEmail(auth, email);
      console.log(`✅ [AuthContext] Password reset email sent to: ${email}`);
    } catch (error) {
      console.error('❌ [AuthContext] resetPassword error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  // ─── Refresh Token ──────────────────────────────────────────────────────────
  const refreshToken = async (): Promise<void> => {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
      console.log('🔄 [AuthContext] Token refreshed.');
    }
  };

  // ─── Update Firestore Profile ───────────────────────────────────────────────
  const updateUserProfileData = async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('Not authenticated.');
    try {
      await updateUserProfile(user.uid, data);
      // Refresh local state
      const updated = await getUserProfile(user.uid);
      setUserProfile(updated);
    } catch (error) {
      console.error('❌ [AuthContext] updateUserProfileData error:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  };

  // ─── Complete Spiritual Onboarding ─────────────────────────────────────────
  const completeSpiritualOnboarding = async (
    spiritual: SpiritualProfile,
    language: string
  ): Promise<void> => {
    if (!user) throw new Error('Not authenticated.');
    console.info(`[AuthContext] Initiating saveSpiritualProfile for UID: ${user.uid}`);
    try {
      await saveSpiritualProfile(user.uid, spiritual, language);
      const updated = await getUserProfile(user.uid);
      setUserProfile(updated);
      console.info(`✅ [AuthContext] Onboarding data saved successfully for UID: ${user.uid}`);
    } catch (error) {
      console.error('❌ [AuthContext] completeSpiritualOnboarding error:', error);
      throw new Error('Unable to save onboarding details. Please retry onboarding.');
    }
  };

  // ─── Context Value ──────────────────────────────────────────────────────────
  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    profileLoading,
    isAdmin,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshToken,
    updateUserProfileData,
    completeSpiritualOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
