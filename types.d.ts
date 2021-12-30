/**
 * @module 设备方向
 */

import React from "react";

interface CoarseOrientation {
  "LANDSCAPE": string
  "PORTRAIT": string
  "PORTRAITUPSIDEDOWN": string
  "UNKNOWN": string
}
interface SpecificOrientation {
  "LANDSCAPE-LEFT": string
  "LANDSCAPE-RIGHT": string
  "PORTRAIT": string
  "PORTRAITUPSIDEDOWN": string
  "UNKNOWN": string
}

declare const getOrientation: (callback: (error: any, orientation: keyof CoarseOrientation) => void) => void;

declare const getSpecificOrientation: (callback: (error: any, orientation: keyof SpecificOrientation) => void) => void;

declare const lockToPortrait: () => void;

declare const lockToLandscape: () => void;

declare const lockToLandscapeRight: () => void;

declare const lockToLandscapeLeft: () => void;

declare const unlockAllOrientations: () => void;

declare const unlockAllOrientationsButUpsidedown: () => void;

declare const getInitialOrientation: () => string;
declare const addOrientationListener: (callback: (orientation: keyof CoarseOrientation) => void) => any;
declare const removeOrientationListener: (callback: any) => void;
declare const addSpecificOrientationListener: (callback: (orientation: keyof SpecificOrientation) => void) => any;
declare const removeSpecificOrientationListener: (callback: any) => void;

declare const DeviceOrientation: {
  getOrientation: typeof getOrientation,
  getSpecificOrientation: typeof getSpecificOrientation,
  lockToPortrait: typeof lockToPortrait,
  lockToLandscape: typeof lockToLandscape,
  lockToLandscapeRight: typeof lockToLandscapeRight,
  lockToLandscapeLeft: typeof lockToLandscapeLeft,
  unlockAllOrientations: typeof unlockAllOrientations,
  unlockAllOrientationsButUpsidedown: typeof unlockAllOrientationsButUpsidedown,
  getInitialOrientation: typeof getInitialOrientation,
  addOrientationListener: typeof addOrientationListener,
  removeOrientationListener: typeof removeOrientationListener,
  addSpecificOrientationListener: typeof addSpecificOrientationListener,
  removeSpecificOrientationListener: typeof removeSpecificOrientationListener,
};
export {
  DeviceOrientation,
  getOrientation,
  getSpecificOrientation,
  lockToPortrait,
  lockToLandscape,
  lockToLandscapeRight,
  lockToLandscapeLeft,
  unlockAllOrientations,
  unlockAllOrientationsButUpsidedown,
  getInitialOrientation,
  addOrientationListener,
  removeOrientationListener,
  addSpecificOrientationListener,
  removeSpecificOrientationListener
}


/**
 * @module 设备方向
*/

declare const toggleFullscreen: (on: boolean) => void;
declare const toggleImmerseStatusBar: () => void;

declare const RealFullscreen: {
  toggleFullscreen;
  toggleImmerseStatusBar;
}
export {
  RealFullscreen,
  toggleImmerseStatusBar,
  toggleFullscreen
}

/**
 * @module 系统设置
*/

interface EmitterSubscription {
  remove: () => void;
}

type CompleteFunc = () => void

type VolumeType =
  | "call"
  | "system"
  | "ring"
  | "music"
  | "alarm"
  | "notification";

interface VolumeConfig {
  type?: VolumeType;
  playSound?: boolean;
  showUI?: boolean;
}

interface VolumeData {
  value: number;
  call?: number;
  system?: number;
  ring?: number;
  music?: number;
  alarm?: number;
  notification?: number;
}

interface SystemSetting {
  getBrightness: () => Promise<number>;
  setBrightness: (val: number) => Promise<boolean>;
  setBrightnessForce: (val: number) => Promise<boolean>;
  getAppBrightness: () => Promise<number>;
  setAppBrightness: (val: number) => Promise<true>;
  grantWriteSettingPremission: () => void;
  getScreenMode: () => Promise<number>;
  setScreenMode: (val: number) => Promise<boolean>;
  saveBrightness: () => Promise<void>;
  restoreBrightness: () => number;
  getVolume: (type?: VolumeType) => Promise<number>;
  setVolume: (value: number, config?: VolumeConfig | VolumeType) => void;
  addVolumeListener: (
    callback: (volumeData: VolumeData) => void
  ) => EmitterSubscription;
  removeVolumeListener: (listener?: EmitterSubscription) => void;
  isWifiEnabled: () => Promise<boolean>;
  switchWifiSilence: (onComplete?: CompleteFunc) => void;
  switchWifi: (onComplete?: CompleteFunc) => void;
  isLocationEnabled: () => Promise<boolean>;
  getLocationMode: () => Promise<number>;
  switchLocation: (onComplete?: CompleteFunc) => void;
  isBluetoothEnabled: () => Promise<boolean>;
  switchBluetooth: (onComplete?: CompleteFunc) => void;
  switchBluetoothSilence: (onComplete?: CompleteFunc) => void;
  isAirplaneEnabled: () => Promise<boolean>;
  switchAirplane: (onComplete?: CompleteFunc) => void;
  openAppSystemSettings: () => Promise<void>;
  addBluetoothListener: (
    callback: (bluetoothEnabled: boolean) => void
  ) => Promise<EmitterSubscription>;
  addWifiListener: (
    callback: (wifiEnabled: boolean) => void
  ) => Promise<EmitterSubscription | null>;
  addLocationListener: (
    callback: (locationEnabled: boolean) => void
  ) => Promise<EmitterSubscription | null>;
  addLocationModeListener: (
    callback: (locationMode: number) => void
  ) => Promise<EmitterSubscription | null>;
  addAirplaneListener: (
    callback: (airplaneModeEnabled: boolean) => void
  ) => Promise<EmitterSubscription | null>;
  removeListener: (listener?: EmitterSubscription) => void;
}

declare const SystemSetting: SystemSetting;
export {
  SystemSetting
};



/**
 * @缓存模块
 */

interface CacheMountPointProps {
  options: {
    appName: string;
  }
}
declare class CacheMountPoint extends React.Component<CacheMountPointProps, {}>{ }
export {
  CacheMountPoint
}

interface StatusWaiting{code:number;msg:string}
interface StatusCaching{code:number;msg:string}
interface StatusPaused{code:number;msg:string}
interface StatusFailed{code:number;msg:string}
interface StatusUnexpected{code:number;msg:string}
interface StatusUnsupport{code:number;msg:string}
interface StatusObject {
    waiting: StatusWaiting,
    caching: StatusCaching,
    paused: StatusPaused,
    failed: StatusFailed,
    unexpected: StatusUnexpected,
    unsupport: StatusUnsupport,
}
declare const Status : StatusObject;
export { Status }

interface CacheStatus {
  code: number;
  msg:  string;
}
interface CacheTaskPayload {
  movieName: string;
  episodeName: number; //这里是剧集序号
  url:string;    //影片播放地址
  cover:string;  //封面地址
  info:any;   //影片信息、可为任意对象。通常建议保存影片详情页数据。
  abortController:AbortController;    //删除任务中断器
  pauseAbortController?:AbortController;//暂停任务中断器
  onError?:(e) => any;
  onProgress?:(progress) => any;
  onSuccess?:(v) => any;
}
interface CacheTask {
  uuid:        number;
  status:      CacheStatus; //0:waiting, 1:caching , 2:paused, 3:failed , 4:unexpected error
  payload:     CacheTaskPayload;
}
interface Episode {
  name: number;
  path: string;
  url: string;
  tsIntegrity: boolean;
  valide: boolean;
  downloadedTs: string[];
  missedTs: string[];
}
interface DataItem {
  name: string;
  cover: string;
  info: any;
  episodes: Episode[];
  valideEpisodes: Episode[];
  invalideEpisodes: Episode[];
}
declare class CacheStore {

  private hlsPort:number;
  private hlsServer:number;
  private hlsServerDir:string;
  private cacheDir:string;
  private cacheBaseDir:string;

  private taskUUID :number; //下载任务的唯一标识符

  public data: DataItem[]; //本地缓存影片数据
  public maxCachingTaskCount: number; //最大同时下载剧集数
  public onCachingTasks: CacheTask[]; //当前正在缓存的任务的uuid数组
  public onCachingTasksProgress: { string: number }; //当前正在缓存的任务的下载进度,  uuid: pro
  public cacheTasks: CacheTask[]; //所有缓存任务(status: 0 => waiting, 1 => caching , 2 => paused, 3 => failed , 4 => unexpected error )

  private maxM3u8ParseDeepCount = 2;
  private m3u8ParseDeepCount = 2;

  private getMoviePath: (movieName: string) => string;
  private getEpisodePath: (movieName, episodeName) => string
  //获取电影剧集短路径, eg:  mmsdafn/01
  private getShortEpisodePath: (movieName, episodeName) => string
  private downloadEpisode: (task, resume) => Promise<any>;
  private _saveMovieInfo: (info, moviePath) => Promise<any>;
  private _saveMovieCover: (cover, uuid, moviePath, onError) => Promise<string>;
  //该方法仅负责将remote播放链接解析出真正含有 ts 路径的m3u8地址、将对应m3u8下载到本地文件、返回其中的内容(含ts)
  //这里如果有嵌套m3u8，需要返回真实m3u8文件链接
  private _parseM3U8File: (url, file) => Promise<any>;
  private _checkTsFiles: (ePath, content) => Promise<any>;
  //@func scan local videos
  public scanCachedVideos: () => Promise<any[]>;
  //@func scan specific video
  public scanSpecificVideo: (movieName: string) => Promise<any>;

  private setData: (data) => any;

  //@func delete video dir
  public deleteMovie: (movieName: string, onSuccess?: () => void, onError?: (e: any) => any) => Promise<any>;
  //@func delete video
  public deleteEpisode: (movieName: string, episodeName: number, onSuccess?: () => void, onError?: (e: any) => any) => Promise<any>;
  //@func delete by path
  public deleteWithPath: (path: string) => any;
  //@func get storage info
  public getStorageInfo: () => Promise<any>;

  private setOnCachingTasks: (uuids) => any;
  public setMaxCachingTaskCount: (count: number) => void;

  private setCacheTasks: (tasks) => void;

  public removeTask: (uuid: number) => void;
  //重新开始失败的任务
  public restartTask: (task: CacheTask) => void;
  //暂停下载任务
  public pauseTask: (task: CacheTask) => void;
  //恢复下载任务
  public resumeTask: (task: CacheTask) => void;
  //添加下载任务
  public addDownloadTask: (taskPayloads: CacheTaskPayload[]) => void;
  //更新任务下载进度
  public updateTaskProgress: (uuid: number, progress: number) => void;
  //标记任务状态为 3 （失败）
  public markFailedTask: (uuid: number,status:CacheStatus) => void;
  //获取task在 cacheTasks 中的 index
  public getTaskIndex: (uuid: number) => number;
  private onSuccessCallback: (movieName, episodeName, url, ePath) => Promise<any>;
  private onDownloadStartCallback: (uuid) => any;
}
declare const cacheStore: CacheStore;
export {
  cacheStore
}