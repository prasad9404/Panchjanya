package com.panchjanyaa.app;

import android.database.ContentObserver;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Date;

@CapacitorPlugin(name = "SecurityPlugin")
public class SecurityPlugin extends Plugin {

    private ContentObserver screenCaptureObserver;

    @Override
    public void load() {
        super.load();

        Handler handler = new Handler(Looper.getMainLooper());
        screenCaptureObserver = new ContentObserver(handler) {
            @Override
            public void onChange(boolean selfChange, Uri uri) {
                super.onChange(selfChange, uri);
                
                // When a new image is added to MediaStore (like a screenshot), we trigger a violation
                if (uri != null && uri.toString().contains("external")) {
                    Log.d("SecurityPlugin", "Possible screenshot detected: " + uri.toString());
                    
                    JSObject ret = new JSObject();
                    ret.put("type", "screenshot_attempt");
                    ret.put("timestamp", new Date().getTime());
                    notifyListeners("securityViolation", ret);
                }
            }
        };

        getContext().getContentResolver().registerContentObserver(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                true,
                screenCaptureObserver
        );
    }

    @Override
    protected void handleOnDestroy() {
        if (screenCaptureObserver != null) {
            getContext().getContentResolver().unregisterContentObserver(screenCaptureObserver);
        }
        super.handleOnDestroy();
    }
}
