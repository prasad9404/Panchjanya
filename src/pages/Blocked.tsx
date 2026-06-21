import React from 'react';
import { Lock } from 'lucide-react';

export default function Blocked() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-center select-none">
      <div className="max-w-md w-full bg-gray-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl">
        <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Account Suspended
        </h1>
        
        <p className="text-gray-400 mb-8 text-lg">
          Your account has been temporarily blocked due to repeated security violations or unauthorized access attempts.
        </p>
        
        <div className="bg-gray-950 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-500">
            For assistance, please contact the administrator:
            <br />
            <a href="mailto:admin@panchjanya.com" className="text-red-400 font-medium hover:text-red-300 transition-colors mt-2 inline-block">
              admin@panchjanya.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
