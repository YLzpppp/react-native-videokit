
/**
 * @module 设备方向
 */

import DeviceOrientation from './libs/orientation';
export * from './libs/orientation';
export {
    DeviceOrientation
}

/**
 * @module 全屏模式_主要用于隐藏安卓的虚拟底部导航栏以及iOS的HomeIndicator
 */
import {toggleFullscreen,toggleImmerseStatusBar} from './libs/realfullscreen'
export {toggleImmerseStatusBar,toggleFullscreen};
const RealFullscreen = {
    toggleImmerseStatusBar,
    toggleFullscreen
};
export {RealFullscreen};

/**
 * @module 全屏模式_主要用于隐藏安卓的虚拟底部导航栏以及iOS的HomeIndicator
 */
export {default as SystemSetting} from './libs/systemsetting';

/**
 * @module 视频下载
 */
export * from './libs/hlsserver';

/**
 * @module 视频下载
 */
export {default as cacheStore} from './src/cacheStore';
export  * from './src/cacheStore';
export {default as CacheMountPoint} from './src/cacheMountPoint';

/**
 * @module 弹幕组件
 */
