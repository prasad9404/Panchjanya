import { User } from "firebase/auth";

/**
 * Checks if the user is an admin by ensuring both the React Context role
 * AND the Firebase token custom claims are aligned.
 * If there is any discrepancy or expired token, returns false.
 */
export async function verifyAdminState(contextRole: string | null | undefined, user: User | null): Promise<boolean> {
  if (!user || !contextRole) return false;
  
  try {
    const tokenResult = await user.getIdTokenResult();
    const isAdminClaim = !!tokenResult.claims.admin || !!tokenResult.claims.superAdmin;
    const isAdminContext = contextRole === 'Admin' || contextRole === 'admin' || contextRole === 'Super Admin';
    
    return isAdminClaim && isAdminContext;
  } catch (e) {
    console.error("verifyAdminState token check failed", e);
    return false;
  }
}
