package com.Katcha;

import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class MediaScannerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public MediaScannerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "MediaScannerModule";
    }

    @ReactMethod
    public void scanFile(String filePath, Promise promise) {
        try {
            MediaScannerConnection.scanFile(
                reactContext,
                new String[]{filePath},
                null,
                new MediaScannerConnection.OnScanCompletedListener() {
                    @Override
                    public void onScanCompleted(String path, Uri uri) {
                        promise.resolve("File scanned successfully: " + path);
                    }
                }
            );
        } catch (Exception e) {
            promise.reject("SCAN_ERROR", "Failed to scan file: " + e.getMessage());
        }
    }
}
