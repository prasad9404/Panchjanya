package com.panchjanyaa.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int REQUEST_MEDIA_PERMISSION = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Set FLAG_SECURE before super.onCreate completes and WebView renders
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);

        super.onCreate(savedInstanceState);

        // Register SecurityPlugin
        registerPlugin(SecurityPlugin.class);

        // Request media read permission for screenshot ContentObserver detection.
        // FLAG_SECURE blocking works independently of this — this only enables detection.
        requestMediaPermissionIfNeeded();

        // Initial debug summary log
        logSecurityStatus("onCreate");
    }

    @Override
    protected void onResume() {
        super.onResume();

        // Ensure FLAG_SECURE re-applies on every resume (protecting against OEM launcher resets)
        if (SecurityPlugin.isAdminMode) {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
        } else {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        }

        logSecurityStatus("onResume");
    }

    private void requestMediaPermissionIfNeeded() {
        // API 33+ uses READ_MEDIA_IMAGES; API 23-32 uses READ_EXTERNAL_STORAGE
        String permission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                ? Manifest.permission.READ_MEDIA_IMAGES
                : Manifest.permission.READ_EXTERNAL_STORAGE;

        if (ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED) {
            Log.d("PanchjanyaSecurity", "Media read permission already granted — registering screenshot observer.");
            SecurityPlugin.registerScreenshotObserver(this);
        } else {
            Log.d("PanchjanyaSecurity", "Requesting media read permission: " + permission);
            ActivityCompat.requestPermissions(this, new String[]{permission}, REQUEST_MEDIA_PERMISSION);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_MEDIA_PERMISSION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d("PanchjanyaSecurity", "Media permission granted — registering screenshot observer.");
                SecurityPlugin.registerScreenshotObserver(this);
            } else {
                // Permission denied — FLAG_SECURE still blocks screenshots; detection just won't fire.
                Log.w("PanchjanyaSecurity", "Media permission denied. Screenshot detection disabled; FLAG_SECURE blocking is still active.");
            }
        }
    }

    private void logSecurityStatus(String source) {
        boolean isSecureEnabled = (getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_SECURE) != 0;
        Log.d("PanchjanyaSecurity", "[" + source + "] SECURE_FLAG_STATUS: " + (isSecureEnabled ? "enabled" : "disabled")
                + ", ADMIN_MODE: " + SecurityPlugin.isAdminMode + ", ACTIVITY: " + getClass().getName());
    }
}
