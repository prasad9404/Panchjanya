import { auth, db } from "@/auth/firebase";
import { getDoc, doc } from "firebase/firestore";
import { violationService } from "./violationService";
import { SecurityViolation } from "./securityService";
import { signOut as firebaseSignOut } from "firebase/auth";

export const authService = {
  /**
   * Performs a strictly secure verification by forcing a token refresh
   * and fetching the latest user document. BOTH must indicate admin privileges.
   */
  async verifyAdminAccess(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      // Force refresh the token to get latest claims
      const tokenResult = await user.getIdTokenResult(true);
      const isTokenAdmin = !!tokenResult.claims.admin || !!tokenResult.claims.superAdmin;

      // Fetch the latest document from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.exists() ? userDoc.data()?.role : 'user';
      const isDocAdmin = role === 'admin' || role === 'super_admin';

      // Check Env variables for bootstrapping
      const envAdmin = import.meta.env.VITE_ADMIN_EMAIL;
      const envSuperAdmin = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
      const isEnvAdmin = (envAdmin && user.email === envAdmin) || (envSuperAdmin && user.email === envSuperAdmin);

      // Both conditions must be met to grant admin access, OR they must be the environment-configured admin
      const valid = (isTokenAdmin && isDocAdmin) || isEnvAdmin;

      if (!valid) {
        // Mismatch or invalid: log critical violation
        console.warn("verifyAdminAccess failed", { isTokenAdmin, isDocAdmin, role });
        await violationService.logViolation({
          userId: user.uid,
          userName: user.displayName || 'Unknown',
          userEmail: user.email || 'Unknown',
          type: 'admin_bypass_attempt' as any,
          severity: 'critical',
          timestamp: Date.now(),
          platform: 'web',
          deviceInfo: navigator.userAgent,
          ip: 'unknown',
          blocked: true
        } as SecurityViolation);
        return false;
      }

      return true;
    } catch (e) {
      console.error("verifyAdminAccess error", e);
      return false;
    }
  },

  /**
   * Safely completely wipes the local session and logs the user out
   */
  async forceLogoutAndLock() {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore sign out errors
    }
    const savedLang = localStorage.getItem('panchajanya_lang');
    localStorage.clear();
    sessionStorage.clear();
    if (savedLang) localStorage.setItem('panchajanya_lang', savedLang);
    window.location.href = '/auth/login';
  }
};
