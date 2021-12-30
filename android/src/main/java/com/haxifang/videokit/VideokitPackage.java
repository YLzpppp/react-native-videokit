package com.haxifang.videokit;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.bridge.JavaScriptModule;

import com.haxifang.videokit.orientation.DeviceOrientationModule;
import com.haxifang.videokit.systemsetting.SystemSetting;
import com.haxifang.videokit.realfullscreen.RealFullscreenModule;

public class VideokitPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(
                new VideokitModule(reactContext),
                new DeviceOrientationModule(reactContext),
                new SystemSetting(reactContext),
                new RealFullscreenModule(reactContext)
        );
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
