# react-native-videokit

#### 安装方法 🔨

```
yarn add git+http://code.haxibiao.cn/packages/react-native-videokit.git
```

### Mostly automatic installation



### 手动处理部分

#### android

在MainActivity下添加如下方法

```java
  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    Intent intent = new Intent("onConfigurationChanged");
    intent.putExtra("newConfig", newConfig);
    this.sendBroadcast(intent);
  }
```

修改设备亮度等设置则需要添加如下相关权限

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="YourPackageName"
    android:versionCode="1"
    android:versionName="1.0">
    
    <!-- setBrightness() & setScreenMode() & saveBrightness() -->
    <uses-permission android:name="android.permission.WRITE_SETTINGS" />
    
    <!-- isWifiEnabled() -->
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
    
    <!-- isBluetoothEnabled() -->
    <uses-permission android:name="android.permission.BLUETOOTH"/>
    
    <!-- * switchWifiSilence() -->
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE"/>

    <!-- * switchBluetoothSilence() -->
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
    
    ...

</manifest>
```

#### iOS

iOS 端需要手动生成一个类（这里示例取名为 RootViewController）。该类需要继承 RNVideoKitViewController

```objective-c
/// 文件 RootViewController.h
#import <UIKit/UIKit.h>
#import <RNVideoKitViewController.h>
@interface RootViewController : RNVideoKitViewController
@end

/// 文件 RootViewController.m

#import "RootViewController.h"

@interface RootViewController ()
@end

@implementation RootViewController
- (void)viewDidLoad {
    [super viewDidLoad];
}
@end
```

修改 AppDelegate.m

```objective-c
#import "RootViewController.h" //引入这个文件
```

```objective-c
...
	self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
//  UIViewController *rootViewController = [UIViewController new];
  RootViewController *rootViewController = [RootViewController new]; //主要修改这里
  rootViewController.view = rootView;
  
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
  
  ...
```



## RealFullscreen Part

#### Usage

这里一共有两个方法 toggleFullscreen 和 toggleImmerseStatusBar
前者的主要作用是用于彻底隐藏安卓全面屏手机的底部虚拟导航栏以及iOS刘海屏手机的底部导航条
后者的作用是当屏幕全屏的时候，可以让安卓全面屏手机页面的内容侵入到状态下面（默认页面内容无法侵入），实现真正的全屏播放。

toggleFullscreen ： iOS & Android 可用

toggleImmerseStatusBar: Android 可用

```javascript
import { RealFullscreen } from 'react-native-realfullscreen';

//开启全屏模式
RealFullscreen.toggleFullscreen(true);

//退出全屏模式
RealFullscreen.toggleFullscreen(false);

//这个方法在App.tsx 或者 index.js 等根入口文件出全局调用一次即可
RealFullscreen.toggleImmerseStatusBar();
```




## Orientation Part


#### 使用方法

#### import { DeviceOrentation } from 'react-native-videokit';

#### getOrientation 

获取当前屏幕方向

#### getSpecificOrientation【iOS】

获取当前屏幕具体方向

#### lockToPortrait

锁定到竖屏方向

#### lockToLandscape

锁定到横屏方向

#### lockToLandscapeRight

锁定到横屏正向（右）

#### lockToLandscapeLeft

锁定到横屏逆向（左）

#### unlockAllOrientations

移除屏幕方向锁定

#### getInitialOrientation

获取屏幕初始方向

#### addOrientationListener

添加屏幕旋转方向监听事件

#### removeOrientationListener

移除监听

#### addSpecificOrientationListener【iOS】

添加屏幕旋转具体方向监听事件

#### removeSpecificOrientationListener【iOS】

移除监听

监听使用示例：

```typescript
const listener = DeviceOrientation.addOrientationListener((orientation) => {
      //TODO
})
DeviceOrientation.removeOrientationListener(listener)
```

> interface CoarseOrientation {
>
> ​    "LANDSCAPE":string
>
> ​    "PORTRAIT":string
>
> ​    "PORTRAITUPSIDEDOWN":string
>
> ​    "UNKNOWN":string
>
> }
>
> interface SpecificOrientation {
>
> ​    "LANDSCAPE-LEFT":string
>
> ​    "LANDSCAPE-RIGHT":string
>
> ​    "PORTRAIT":string
>
> ​    "PORTRAITUPSIDEDOWN":string
>
> ​    "UNKNOWN":string
>
> }


## SystemSetting Part

#### Usage

**Common import**

```javascript
import SystemSetting from 'react-native-system-setting'
```

**volume**

```javascript
//get the current volume
SystemSetting.getVolume().then((volume)=>{
    console.log('Current volume is ' + volume);
});

// change the volume
SystemSetting.setVolume(0.5);

// listen the volume changing if you need
const volumeListener = SystemSetting.addVolumeListener((data) => {
    const volume = data.value;
    console.log(volume);
});

//remove listener when you need it no more
SystemSetting.removeVolumeListener(volumeListener)       
```

> `setVolume` can do more, [more detail](https://github.com/c19354837/react-native-system-setting/blob/master/API.md) 

**brightness**

```javascript
//get the current brightness
SystemSetting.getBrightness().then((brightness)=>{
    console.log('Current brightness is ' + brightness);
});

//change the brightness & check permission
SystemSetting.setBrightnessForce(0.5).then((success)=>{
    !success && Alert.alert('Permission Deny', 'You have no permission changing settings',[
	   {'text': 'Ok', style: 'cancel'},
	   {'text': 'Open Setting', onPress:()=>SystemSetting.grantWriteSettingPermission()}
	])
});

// save the value of brightness and screen mode.
SystemSetting.saveBrightness();
// restore the brightness and screen mode. you can get the old brightness value.
SystemSetting.restoreBrightness().then((oldVal)=>{
    //if you need
})

// change app's brightness without any permission.
SystemSetting.setAppBrightness(0.5);
SystemSetting.getAppBrightness().then((brightness)=>{
    console.log('Current app brightness is ' + brightness);
})
```

> `setBrightness()` & `saveBrightness()` need [permission](https://github.com/c19354837/react-native-system-setting#android-permission) for Android

**Wifi**

```javascript
SystemSetting.isWifiEnabled().then((enable)=>{
    const state = enable ? 'On' : 'Off';
    console.log('Current wifi is ' + state);
})

SystemSetting.switchWifi(()=>{
    console.log('switch wifi successfully');
})
```

> `isWifiEnabled()` need [permission](https://github.com/c19354837/react-native-system-setting#android-permission) for Android
> 
> `switchWifi()` is disabled by default for iOS since V1.7.0, [enable it](https://github.com/c19354837/react-native-system-setting/blob/master/iOS.md#ios)

**Location**

```javascript
SystemSetting.isLocationEnabled().then((enable)=>{
    const state = enable ? 'On' : 'Off';
    console.log('Current location is ' + state);
})

SystemSetting.switchLocation(()=>{
    console.log('switch location successfully');
})
```
> `switchLocation()` is disabled by default for iOS since V1.7.0, [enable it](https://github.com/c19354837/react-native-system-setting/blob/master/iOS.md#ios)

**Bluetooth**

```javascript
SystemSetting.isBluetoothEnabled().then((enable)=>{
    const state = enable ? 'On' : 'Off';
    console.log('Current bluetooth is ' + state);
})

SystemSetting.switchBluetooth(()=>{
    console.log('switch bluetooth successfully');
})
```

> `isBluetoothEnabled()` need [permission](https://github.com/c19354837/react-native-system-setting#android-permission) for Android
>
> All bluetooth-function are disabled by default for iOS since V1.7.0, [enable it](https://github.com/c19354837/react-native-system-setting/blob/master/iOS.md#ios)

**Airplane**

```javascript
SystemSetting.isAirplaneEnabled().then((enable)=>{
    const state = enable ? 'On' : 'Off';
    console.log('Current airplane is ' + state);
})

SystemSetting.switchAirplane(()=>{
    console.log('switch airplane successfully');
})
```

> `isAirplaneEnabled()` will always return `true` for iOS if your device has no SIM card, see [detail](https://github.com/c19354837/react-native-system-setting/issues/37)
> 
> `switchAirplane()` is disabled by default for iOS since V1.7.0, [enable it](https://github.com/c19354837/react-native-system-setting/blob/master/iOS.md#ios)

**Other**

```javascript
// open app setting page
SystemSetting.openAppSystemSettings()
```



### Do Not Disturb

`setVolume()` may cause a crash: **Not allowed to change Do Not Disturb state**. See [detail](https://github.com/c19354837/react-native-system-setting/issues/48).

### Runtime permission for Android 6+

Change *brightness* and *screen mode* need `android.permission.WRITE_SETTINGS` which user can disable it in phone Setting. When you call `setScreenMode()`, `setBrightness()` or `setBrightnessForce()` , it will return false if the app has no permission, and you can call `SystemSetting.grantWriteSettingPermission()` to guide user to app setting page

> If you just want to change app's brightness, you can call `setAppBrightness(val)`, and it doesn't require any permission.

