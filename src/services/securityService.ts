import { Capacitor } from '@capacitor/core';
import { getAuth } from 'firebase/auth';
import { violationService } from './violationService';

export type SecurityViolationType = 
  | 'screenshot_attempt' 
  | 'screen_record_attempt' 
  | 'devtools_open' 
  | 'copy_paste_attempt' 
  | 'rooted_device' 
  | 'jailbroken_device'
  | 'keyboard_shortcut'
  // Web-level OS-focus signals: fires when screenshot tools or recording
  // overlays steal window focus. Not conclusive proof but an auditable signal.
  | 'screen_focus_lost'
  | 'window_blur';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityViolation {
  userId?: string;
  userName?: string;
  userEmail?: string;
  type: SecurityViolationType;
  timestamp: number;
  platform: string;
  deviceInfo: string;
  severity: SecuritySeverity;
  blocked: boolean;
  ip?: string;
}

class SecurityService {
  private user: any = null;
  private violationCount = 0;
  private offlineQueue: SecurityViolation[] = [];
  private isProcessingQueue = false;

  constructor() {
    try {
      const stored = localStorage.getItem('security_violations_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (e) {}
    
    window.addEventListener('online', () => this.flushQueue());
  }

  setUser(user: any) {
    this.user = user;
  }

  isBlocked() {
    return localStorage.getItem('user_blocked') === 'true';
  }

  blockUser() {
    localStorage.setItem('user_blocked', 'true');
    window.location.href = '/blocked';
  }

  async reportViolation(type: SecurityViolationType, severity: SecuritySeverity) {
    if (this.isBlocked()) return;

    this.violationCount++;
    const shouldBlock = this.violationCount >= 3 || severity === 'critical';
    const platform = Capacitor.getPlatform();
    const deviceInfo = navigator.userAgent;

    const violation: SecurityViolation = {
      userId: this.user?.uid || this.user?.id || 'anonymous',
      userName: this.user?.displayName || this.user?.name || 'Unknown',
      userEmail: this.user?.email || 'Unknown',
      type,
      timestamp: Date.now(),
      platform,
      deviceInfo,
      severity,
      blocked: shouldBlock
    };

    if (shouldBlock) {
      this.blockUser();
    }

    if (navigator.onLine) {
      await this.sendToBackend(violation);
    } else {
      this.queueOffline(violation);
    }
  }

  private queueOffline(violation: SecurityViolation) {
    this.offlineQueue.push(violation);
    localStorage.setItem('security_violations_queue', JSON.stringify(this.offlineQueue));
  }

  async flushQueue() {
    if (this.isProcessingQueue || this.offlineQueue.length === 0 || !navigator.onLine) return;
    
    this.isProcessingQueue = true;
    const queueToProcess = [...this.offlineQueue];
    this.offlineQueue = [];
    localStorage.removeItem('security_violations_queue');

    try {
      for (const violation of queueToProcess) {
        await this.sendToBackend(violation);
      }
    } catch (e) {
      this.offlineQueue = [...queueToProcess, ...this.offlineQueue];
      localStorage.setItem('security_violations_queue', JSON.stringify(this.offlineQueue));
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sendToBackend(violation: SecurityViolation) {
    try {
      await violationService.logViolation(violation);
    } catch (error) {
      console.error('Failed to report security violation', error);
      throw error;
    }
  }
}

export const securityService = new SecurityService();
