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
  AuthError,
} from 'firebase/auth';
import { auth } from '@/auth/firebase';
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

  // ── Load Firestore profile when Firebase Auth user is available ────────────
  const loadUserProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    try {
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
    } catch (err) {
      console.error('❌ [AuthContext] Failed to load user profile:', err);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // ── Listen to Firebase Auth state changes ─────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Load Firestore profile in parallel with claims check
        loadUserProfile(currentUser);

        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          const isUserAdmin = !!idTokenResult.claims.admin;
          const isUserSuperAdmin = !!idTokenResult.claims.superAdmin;

          console.log(
            `👤 %cAuth State Change: ${currentUser.email}`,
            'color: #3b82f6; font-weight: bold;',
            `(Admin: ${isUserAdmin}, Super: ${isUserSuperAdmin})`
          );

          // Env email fallback (dev only — not a security boundary)
          const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
          const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;

          if (!isUserSuperAdmin && superAdminEmail && currentUser.email === superAdminEmail) {
            console.warn("⚠️ Custom claim 'superAdmin' missing, falling back to VITE_SUPER_ADMIN_EMAIL.");
            setIsSuperAdmin(true);
            setIsAdmin(true);
          } else {
            setIsSuperAdmin(isUserSuperAdmin);
            if (!isUserAdmin && adminEmail && currentUser.email === adminEmail) {
              console.warn("⚠️ Custom claim 'admin' missing, falling back to VITE_ADMIN_EMAIL.");
              setIsAdmin(true);
            } else {
              setIsAdmin(isUserAdmin || isUserSuperAdmin);
            }
          }
        } catch (error) {
          console.error('❌ [AuthContext] Error checking admin claims:', error);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

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
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = credential;

      // 2. Set display name in Firebase Auth
      await updateFirebaseProfile(firebaseUser, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      // 3. Create Firestore user document
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
      await createUserProfile(firebaseUser.uid, profileData);

      console.log(`✅ [AuthContext] Registered new user: ${firebaseUser.uid}`);
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
      // Navigation is handled by the calling component, not here.
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
    try {
      await saveSpiritualProfile(user.uid, spiritual, language);
      const updated = await getUserProfile(user.uid);
      setUserProfile(updated);
      console.log(`✅ [AuthContext] Onboarding completed for uid: ${user.uid}`);
    } catch (error) {
      console.error('❌ [AuthContext] completeSpiritualOnboarding error:', error);
      throw new Error('Failed to save spiritual details. Please try again.');
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
