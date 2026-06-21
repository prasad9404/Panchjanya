import { db } from "@/auth/firebase";
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, increment } from "firebase/firestore";
import { SecurityViolation } from "./securityService";

const VIOLATIONS_COL = "securityViolations";
const USERS_COL = "users";

export const violationService = {
  async logViolation(violation: SecurityViolation) {
    try {
      // 1. Add violation
      await addDoc(collection(db, VIOLATIONS_COL), violation);
      
      // 2. Increment user violationCount and handle auto-blocking
      if (violation.userId && violation.userId !== "anonymous") {
        const userRef = doc(db, USERS_COL, violation.userId);
        
        await updateDoc(userRef, {
          violationCount: increment(1)
        });
        
        // 3. Auto-block logic
        if (violation.severity === 'critical' || violation.blocked) {
          await this.blockUserInDB(violation.userId, violation.type);
        }
      }
    } catch (error) {
      console.error("Failed to log violation to Firestore", error);
    }
  },

  async blockUserInDB(userId: string, reason?: string) {
    if (!userId || userId === "anonymous") return;
    try {
      const userRef = doc(db, USERS_COL, userId);
      await updateDoc(userRef, {
        blocked: true,
        blockedReason: reason || "security_violation",
        blockedAt: Date.now()
      });
    } catch (error) {
      console.error("Failed to block user", error);
      throw error;
    }
  },

  async unblockUser(userId: string) {
    try {
      const userRef = doc(db, USERS_COL, userId);
      await updateDoc(userRef, {
        blocked: false,
        violationCount: 0,
        blockedReason: null,
        blockedAt: null
      });
    } catch (error) {
      console.error("Failed to unblock user", error);
      throw error;
    }
  },

  async getAllViolations(): Promise<(SecurityViolation & { id: string })[]> {
    try {
      const q = query(collection(db, VIOLATIONS_COL), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityViolation & { id: string }));
    } catch (error) {
      console.error("Failed to fetch all violations", error);
      return [];
    }
  },

  async getUserViolations(userId: string): Promise<(SecurityViolation & { id: string })[]> {
    try {
      const q = query(collection(db, VIOLATIONS_COL), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityViolation & { id: string }));
      // Sort in memory to avoid needing a composite index in Firestore
      return docs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Failed to fetch user violations", error);
      return [];
    }
  },

  async getViolationStats() {
    try {
      // Fetch all for stats
      const q = query(collection(db, VIOLATIONS_COL));
      const snapshot = await getDocs(q);
      const violations = snapshot.docs.map(doc => doc.data() as SecurityViolation);
      
      // Fetch blocked users count
      const usersQ = query(collection(db, USERS_COL), where("blocked", "==", true));
      const usersSnap = await getDocs(usersQ);
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      return {
        total: violations.length,
        critical: violations.filter(v => v.severity === 'critical').length,
        blockedUsers: usersSnap.size,
        today: violations.filter(v => v.timestamp >= todayStart).length
      };
    } catch (error) {
      console.error("Failed to get violation stats", error);
      return { total: 0, critical: 0, blockedUsers: 0, today: 0 };
    }
  }
};
