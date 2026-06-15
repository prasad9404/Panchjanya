/**
 * userService.ts
 *
 * Handles all Firestore operations for user profiles.
 * Firebase Auth stores authentication credentials.
 * Firestore `users/{uid}` stores all additional profile data.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, storage } from '@/auth/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SpiritualStatus = 'Naam Dharak' | 'Vasnik' | 'Bhikshuk' | '';

export interface SpiritualProfile {
  status: SpiritualStatus;
  naamMantra?: boolean;
  guruvaryaName?: string;
  guruvaryaPlace?: string;
  guruvaryaYear?: string;
  vidyaKnowledge?: string;
  vidyaGuruvaryaName?: string;
  vidyaGuruvaryaPlace?: string;
  vidyaGuruvaryaYear?: string;
  vidyaStudiedMode?: 'Observable' | 'Online' | '';
  dikshaGuruvaryaName?: string;
  dikshaGuruvaryaPlace?: string;
  dikshaGuruvaryaYear?: string;
  agreedToTerms?: boolean;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  mobile: string;
  whatsapp?: string;
  email: string; // synthetic: mobile@panchjanya.app
  gender?: string;
  age?: string;
  state?: string;
  district?: string;
  taluka?: string;
  city?: string;
  username?: string;
  bio?: string;
  profileImage?: string;
  role: 'user' | 'admin' | 'super_admin';
  spiritualProfile?: SpiritualProfile;
  preferredLanguage?: string;
  onboardingComplete?: boolean;
  createdAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type CreateUserProfileData = Omit<UserProfile, 'uid' | 'createdAt' | 'lastLoginAt' | 'updatedAt' | 'role'>;
export type UpdateUserProfileData = Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'email' | 'mobile' | 'role'>>;

// ─── Synthetic Email Helper ───────────────────────────────────────────────────

/**
 * Converts a 10-digit Indian mobile number to a synthetic Firebase Auth email.
 * This allows phone-first UX without requiring SMS billing.
 * e.g. "9876543210" → "9876543210@panchjanya.app"
 */
export function mobileToEmail(mobile: string): string {
  // Normalize: strip +91, spaces, dashes
  const digits = mobile.replace(/[\s\-+]/g, '').replace(/^91/, '');
  return `${digits}@panchjanya.app`;
}

/**
 * Extracts mobile digits from a synthetic email.
 */
export function emailToMobile(email: string): string {
  return email.replace('@panchjanya.app', '');
}

// ─── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Validates a 10-digit Indian mobile number.
 */
export function isValidMobile(mobile: string): boolean {
  const digits = mobile.replace(/[\s\-+]/g, '').replace(/^91/, '');
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 */
export function isStrongPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: '' };
}

// ─── Firestore Operations ─────────────────────────────────────────────────────

/**
 * Checks if a mobile number is already registered.
 * Used for duplicate prevention during registration.
 */
export async function checkMobileExists(mobile: string): Promise<boolean> {
  const digits = mobile.replace(/[\s\-+]/g, '').replace(/^91/, '');
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('mobile', '==', digits));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Creates a new user profile document in Firestore.
 * Called immediately after Firebase Auth user creation.
 */
export async function createUserProfile(
  uid: string,
  data: CreateUserProfileData
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const digits = data.mobile.replace(/[\s\-+]/g, '').replace(/^91/, '');

  const profile: UserProfile = {
    uid,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    displayName: `${data.firstName.trim()} ${data.lastName.trim()}`,
    mobile: digits,
    whatsapp: data.whatsapp ? data.whatsapp.replace(/[\s\-+]/g, '').replace(/^91/, '') : digits,
    email: mobileToEmail(digits),
    gender: data.gender || '',
    age: data.age || '',
    state: data.state || '',
    district: data.district || '',
    taluka: data.taluka || '',
    city: data.city || '',
    profileImage: '',
    role: 'user',
    spiritualProfile: {
      status: '',
    },
    preferredLanguage: data.preferredLanguage || 'mr',
    onboardingComplete: false,
    createdAt: serverTimestamp() as Timestamp,
    lastLoginAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  try {
    await setDoc(userRef, profile);
    console.info(`✅ [userService] Created profile for uid: ${uid}. Data:`, {
      name: profile.displayName,
      mobile: profile.mobile,
      state: profile.state,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ [userService] Error creating profile for uid: ${uid}`, error);
    throw error;
  }
}

/**
 * Retrieves a user profile from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    console.warn(`⚠️ [userService] No profile found for uid: ${uid}`);
    return null;
  }
  return { uid, ...snapshot.data() } as UserProfile;
}

/**
 * Partially updates a user profile (safe — cannot overwrite role/uid/email/createdAt).
 */
export async function updateUserProfile(
  uid: string,
  data: UpdateUserProfileData
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  // Safety: strip fields users should not self-modify at runtime
  const { role, uid: _uid, email, mobile, createdAt, ...safeData } = data as any;
  try {
    await updateDoc(userRef, {
      ...safeData,
      updatedAt: serverTimestamp(),
    });
    console.info(`✅ [userService] Updated profile for uid: ${uid}. Fields:`, Object.keys(safeData));
  } catch (error) {
    console.error(`❌ [userService] Error updating profile for uid: ${uid}`, error);
    throw error;
  }
}

/**
 * Saves spiritual profile data after onboarding.
 */
export async function saveSpiritualProfile(
  uid: string,
  spiritualProfile: SpiritualProfile,
  preferredLanguage: string,
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      spiritualProfile,
      preferredLanguage,
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    });
    console.info(`✅ [userService] Saved spiritual profile for uid: ${uid}. Status: ${spiritualProfile.status}`);
  } catch (error) {
    console.error(`❌ [userService] Error saving spiritual profile for uid: ${uid}`, error);
    throw error;
  }
}

/**
 * Updates the last login timestamp.
 * Called on every successful sign-in.
 */
export async function updateLastLogin(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    lastLoginAt: serverTimestamp(),
  });
}

/**
 * Checks if a username is already taken by another user.
 */
export async function checkUsernameExists(username: string, currentUid: string): Promise<boolean> {
  if (!username) return false;
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const snapshot = await getDocs(q);
  
  // Exclude current user from the check
  const otherUsers = snapshot.docs.filter(doc => doc.id !== currentUid);
  return otherUsers.length > 0;
}

/**
 * Uploads a profile image to Firebase Storage and returns the download URL.
 */
export async function uploadProfileImage(file: File, uid: string): Promise<string> {
  // Use a predictable path so it overwrites the old image automatically
  // Path matches storage.rules: /users/{uid}/profile/{fileName}
  const imageRef = ref(storage, `users/${uid}/profile/avatar.webp`);
  
  // Set explicit metadata
  const metadata = {
    contentType: file.type || 'image/webp',
  };

  const snapshot = await uploadBytes(imageRef, file, metadata);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  
  console.log(`✅ [userService] Uploaded profile image for uid: ${uid}`);
  return downloadUrl;
}

