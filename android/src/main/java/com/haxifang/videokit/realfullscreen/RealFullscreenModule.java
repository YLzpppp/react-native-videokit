package com.haxifang.videokit.realfullscreen;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import java.lang.Runnable;
import android.app.Activity;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;

public class RealFullscreenModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public RealFullscreenModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RealFullscreen";
    }

    @ReactMethod
    public void toggleFullscreen(boolean on) {
        final Activity activity = getCurrentActivity();
        if(on){
            final int flags = View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            if(activity != null){
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        activity.getWindow().getDecorView().setSystemUiVisibility(flags);
                    }
                });
            }
        }else{
            final int flags = View.SYSTEM_UI_FLAG_VISIBLE;
            if(activity != null){
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        activity.getWindow().getDecorView().setSystemUiVisibility(flags);
                    }
                });
            }
        }
    }

    @ReactMethod
    public void toggleImmerseStatusBar(){
        final Activity activity = getCurrentActivity();
        if(activity != null){
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    WindowManager.LayoutParams layoutParams = activity.getWindow().getAttributes();
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                        activity.getWindow().setAttributes(layoutParams);
                    }
                }
            });
        }
    }
}
