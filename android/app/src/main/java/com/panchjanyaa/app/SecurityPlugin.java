package com.panchjanyaa.app;

import android.content.Context;
import android.database.ContentObserver;
import android.database.Cursor;
import android.hardware.display.DisplayManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Log;
import android.view.Display;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Date;

@CapacitorPlugin(name = "SecurityPlugin")
public class SecurityPlugin extends Plugin {

    public static boolean isAdminMode = false;
    // Held statically so MainActivity can register ContentObserver after permission grant
    private static SecurityPlugin instance;
    private ContentObserver screenCaptureObserver;
    private boolean screenshotObserverRegistered = false;
    private DisplayManager displayManager;
    private DisplayManager.DisplayListener displayListener;

    /**
     * Called by MainActivity after READ_MEDIA_IMAGES / READ_EXTERNAL_STORAGE is granted.
     * Safe to call multiple times — registers only once.
     */
    public static void registerScreenshotObserver(Context context) {
        if (instance != null) {
            instance.doRegisterScreenshotObserver(context);
        } else {
            Log.w("SecurityPlugin", "registerScreenshotObserver called before plugin loaded — observer not registered.");
        }
    }

    @Override
    public void load() {
        super.load();
        instance = this; // Store static reference for permission-gated registration

        Handler handler = new Handler(Looper.getMainLooper());
        
        // Screenshot observer is NOT registered here — it requires a runtime permission.
        // MainActivity calls SecurityPlugin.registerScreenshotObserver() after permission is granted.
        screenCaptureObserver = new ContentObserver(handler) {
            @Override
            public void onChange(boolean selfChange, Uri uri) {
                super.onChange(selfChange, uri);
                if (uri != null) {
                    checkScreenshot(uri);
                }
            }
        };

        // 2. Screen recording / mirroring detection (Android 10+)
        try {
            displayManager = (DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
            if (displayManager != null) {
                displayListener = new DisplayManager.DisplayListener() {
                    @Override
                    public void onDisplayAdded(int displayId) {
                        Log.d("SecurityPlugin", "Display added: " + displayId);
                        checkScreenRecording();
                    }

                    @Override
                    public void onDisplayRemoved(int displayId) {
                        Log.d("SecurityPlugin", "Display removed: " + displayId);
                    }

                    @Override
                    public void onDisplayChanged(int displayId) {
                        Log.d("SecurityPlugin", "Display changed: " + displayId);
                        checkScreenRecording();
                    }
                };
                displayManager.registerDisplayListener(displayListener, handler);
                
                // Initial check
                checkScreenRecording();
            }
        } catch (Exception e) {
            Log.e("SecurityPlugin", "Failed to register DisplayListener for screen recording", e);
        }
    }

    @PluginMethod
    public void setAdminMode(PluginCall call) {
        Boolean enable = call.getBoolean("enable", false);
        Log.d("SecurityPlugin", "setAdminMode called: " + enable);
        
        isAdminMode = enable;
        
        if (getActivity() != null) {
            getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (enable) {
                        getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                        Log.d("SecurityPlugin", "FLAG_SECURE cleared (Admin Mode enabled)");
                    } else {
                        getActivity().getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
                        Log.d("SecurityPlugin", "FLAG_SECURE set (Admin Mode disabled)");
                    }
                    
                    boolean isSecure = (getActivity().getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_SECURE) != 0;
                    Log.d("PanchjanyaSecurity", "[setAdminMode] SECURE_FLAG_STATUS: " + (isSecure ? "enabled" : "disabled") + 
                            ", ADMIN_MODE: " + isAdminMode + ", ACTIVITY: " + getActivity().getClass().getName());
                }
            });
        }
        call.resolve();
    }

    private void checkScreenshot(Uri uri) {
        if (getContext() == null || uri == null) return;
        try {
            String[] projection = {
                MediaStore.Images.Media.DISPLAY_NAME,
                MediaStore.Images.Media.DATA
            };
            try (Cursor cursor = getContext().getContentResolver().query(
                    uri,
                    projection,
                    null,
                    null,
                    null
            )) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(MediaStore.Images.Media.DISPLAY_NAME);
                    int dataIndex = cursor.getColumnIndex(MediaStore.Images.Media.DATA);
                    
                    String displayName = nameIndex != -1 ? cursor.getString(nameIndex) : "";
                    String path = dataIndex != -1 ? cursor.getString(dataIndex) : "";
                    
                    Log.d("SecurityPlugin", "New media entry: Name=" + displayName + ", Path=" + path);
                    
                    boolean isScreenshot = false;
                    if (displayName != null && displayName.toLowerCase().contains("screenshot")) {
                        isScreenshot = true;
                    } else if (path != null && path.toLowerCase().contains("screenshot")) {
                        isScreenshot = true;
                    }
                    
                    if (isScreenshot) {
                        Log.d("SecurityPlugin", "Screenshot detected! Path: " + path);
                        JSObject ret = new JSObject();
                        ret.put("type", "screenshot_detected");
                        ret.put("timestamp", new Date().getTime());
                        notifyListeners("screenshotDetected", ret);
                    }
                }
            }
        } catch (Exception e) {
            // Queries should succeed once permission is granted.
            // If they fail here, the observer was registered without permission.
            Log.e("SecurityPlugin", "Error querying MediaStore — was permission granted before observer registration?", e);
        }
    }

    private void checkScreenRecording() {
        if (getContext() == null) return;
        DisplayManager dm = (DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
        if (dm == null) return;
        
        Display[] displays = dm.getDisplays();
        boolean isRecordingOrMirroring = false;
        
        for (Display display : displays) {
            if (display.getDisplayId() != Display.DEFAULT_DISPLAY) {
                // Secondary display indicates casting, recording, or mirroring
                isRecordingOrMirroring = true;
                Log.d("SecurityPlugin", "Screen recording/mirroring detected on display: " + display.getName() + " (ID: " + display.getDisplayId() + ")");
                break;
            }
        }
        
        if (isRecordingOrMirroring) {
            JSObject ret = new JSObject();
            ret.put("type", "screen_recording_detected");
            ret.put("timestamp", new Date().getTime());
            notifyListeners("screenRecordingDetected", ret);
        }
    }

    private void doRegisterScreenshotObserver(Context context) {
        if (screenshotObserverRegistered) {
            Log.d("SecurityPlugin", "Screenshot observer already registered — skipping.");
            return;
        }
        try {
            context.getContentResolver().registerContentObserver(
                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                    true,
                    screenCaptureObserver
            );
            screenshotObserverRegistered = true;
            Log.d("PanchjanyaSecurity", "Screenshot ContentObserver registered successfully.");
        } catch (Exception e) {
            Log.e("SecurityPlugin", "Failed to register ContentObserver for screenshots", e);
        }
    }

    @Override
    protected void handleOnDestroy() {
        instance = null;
        if (screenshotObserverRegistered && screenCaptureObserver != null && getContext() != null) {
            getContext().getContentResolver().unregisterContentObserver(screenCaptureObserver);
        }
        if (displayManager != null && displayListener != null) {
            displayManager.unregisterDisplayListener(displayListener);
        }
        super.handleOnDestroy();
    }
}
