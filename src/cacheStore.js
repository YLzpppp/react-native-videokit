import { makeAutoObservable, runInAction } from "mobx";
import { encode as _encode, decode as _decode } from "./base64";
import RNFS from "react-native-fs";
import { Platform, InteractionManager } from "react-native";
import { startHLSServerWithPort } from "../libs/hlsserver";
import AsyncStorage from "@react-native-community/async-storage";

const isAndroid = Platform.OS == "android";
const BasePath = "/cached/movies/";
const TSReg = /(\S*)(\/)(\w*.ts)/g;

//M3U8 FILE FLAG FIELD
const EXTINF = "#EXTINF";
const EXTXENDLIST = "#EXT-X-ENDLIST";
const TS = "ts";

const StorageKey = "VideoKitCache_CacheTasks";
//ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
//需要将 + 和 / 替换成其他字符
const BS1 = "-";
const BS2 = "_";
const encode = (input) => {
    let str = _encode(input);
    let reg1 = /\+/g;
    let reg2 = /\//g;
    return str.replace(reg1, BS1).replace(reg2, BS2);
};
const decode = (input) => {
    let reg3 = /-/g;
    let reg4 = /_/g;
    return _decode(input.replace(reg3, "+").replace(reg4, "/"));
};

const TAG = "【VideoKit Cache】";

const StatusMsgWaiting = "等待下载";
const StatusMsgCaching = "正在下载";
const StatusMsgPaused = "下载已暂停";
const StatusMsgFailed = "下载失败";
const StatusMsgUnexpected = "下载失败、意外错误";
const StatusMsgUnsupport = "下载失败、暂不支持下载此文件"; //可能是mp4，也可能是解析规则解析不出等
const StatusMsgUnstable = "下载失败、源文件不完整"; // 404 ts文件过多

const StatusWaiting = { code: 0, msg: StatusMsgWaiting };
const StatusCaching = { code: 1, msg: StatusMsgCaching };
const StatusPaused = { code: 2, msg: StatusMsgPaused };
const StatusFailed = { code: 3, msg: StatusMsgFailed };
const StatusUnexpected = { code: 4, msg: StatusMsgUnexpected };
const StatusUnsupport = { code: 5, msg: StatusMsgUnsupport };

export const Status = {
    waiting: StatusWaiting,
    caching: StatusCaching,
    paused: StatusPaused,
    failed: StatusFailed,
    unexpected: StatusUnexpected,
    unsupport: StatusUnsupport
}

const FormatStatusMsg = (status, msg) => {
    let _status = { ...status };
    _status.msg = msg;
    return _status;
}

/**
 interface Status {
    code number;
    msg  string;
 }
 interface CacheTaskPayload {
    movieName string;
    episodeName index; //这里是剧集序号
    url;    //影片播放地址
    cover;  //封面地址
    info;   //影片信息、可为任意对象。通常建议保存影片详情页数据。
    abortController;    //删除任务中断器
    pauseAbortController;//暂停任务中断器
    onError;
    onProgress;
    onSuccess;
 }
 interface CacheTask {
    uuid        number;
    status      Status; //0:waiting, 1:caching , 2:paused, 3:failed , 4:unexpected error
    payload     CacheTaskPayload;
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
 */

class CacheStore {
    hlsPort = 9876;
    hlsServer = "http://127.0.0.1:9876";
    hlsServerDir = RNFS.DocumentDirectoryPath;
    cacheDir = "";
    cacheBaseDir = "";

    taskUUID = 1; //下载任务的唯一标识符
    data = []; //本地缓存影片数据
    maxCachingTaskCount = 2; //最大同时下载剧集数
    onCachingTasks = []; //当前正在缓存的任务的uuid数组; type => number[];
    onCachingTasksProgress = {}; //当前正在缓存的任务的下载进度, Object struct => uuid: pro
    cacheTasks = [];
    maxM3u8ParseDeepCount = 2;
    m3u8ParseDeepCount = 2;
    maxSafeLostTsPercent = 0.03;

    constructor() {
        makeAutoObservable(this);
    }

    init(configs) {
        //configs: { appName }
        let bpath = "/" + configs.appName + BasePath;
        this.cacheBaseDir = bpath;
        this.cacheDir = RNFS.DocumentDirectoryPath + bpath;
        //start hls server for ios
        if (Platform.OS == "ios") {
            startHLSServerWithPort(this.hlsServerDir, this.hlsPort, (v) => {
                console.log(TAG, "hls sever run on port: ", v);
            });
        }
    }

    initCachedVideoData() {
        InteractionManager.runAfterInteractions(() => {
            this.scanCachedVideos().then((cv) => {
                this.setData(cv);
                getItem(StorageKey).then((v) => {
                    if (v && Array.isArray(v)) {
                        let tks = [...v];
                        for (let t of tks) {
                            t.uuid = this.taskUUID;
                            t.status = StatusUnexpected;
                            t.payload.abortController = new AbortController();
                            t.payload.pauseAbortController = new AbortController();
                            this.taskUUID += 1;
                        }
                        this.setCacheTasks(tks);
                    }
                });
            });
        });
    }

    //获取电影路径
    getMoviePath(movieName) {
        return this.cacheDir + encode(movieName);
    }

    //获取电影剧集路径, eg: ...Documents/MovieApp/01
    getEpisodePath(movieName, episodeName) {
        return this.getMoviePath(movieName) + "/" + episodeName;
    }

    //获取电影剧集短路径, eg:  mmsdafn/01
    getShortEpisodePath(movieName, episodeName) {
        return this.cacheBaseDir + encode(movieName) + "/" + episodeName;
    }

    async downloadEpisode(task, resume) {
        if (this.onCachingTasks.length >= this.maxCachingTaskCount) {
            let pausedTInd = this.getTaskIndex(this.onCachingTasks[0]); //被暂停的任务在 cacheTask中的序号
            this.pauseTask(this.cacheTasks[pausedTInd]);
            let _onCachingTasks = [...this.onCachingTasks];
            _onCachingTasks.splice(0, 1);
            this.setOnCachingTasks(_onCachingTasks);
        }
        let { payload, uuid } = task;
        let movieName = payload.movieName;
        let episodeName = payload.episodeName; // index of episode
        let url = payload.url;
        let cover = payload.cover;
        let info = payload.info;
        let onError = payload.onError;
        let onProgress = payload.onProgress;
        let onSuccess = payload.onSuccess;
        let abortController = payload.abortController; //目前是删除任务时使用的中断控制器
        let pauseAbortController = payload.pauseAbortController; //目前是暂停任务时使用的中断控制器
        var stopNow = false;
        var pauseNow = false;
        var downloadedTsCount = 0;
        var lostTsCount = 0;
        var maxSafeLostTsCount = 0;

        // update task status first
        let tInd = this.getTaskIndex(uuid);
        if (tInd == -1) return;

        this.onDownloadStartCallback(uuid,tInd); //修改当前任务状态、更新缓存任务数组

        // add abort listener
        abortController &&
        abortController.signal.addEventListener("abort", () => {
            stopNow = true;
        });
        pauseAbortController &&
        pauseAbortController.signal.addEventListener("abort", () => {
            pauseNow = true;
        });

        //【Step】parse url domain
        // console.log(TAG, '【Step】parse url domain');
        let domain = ParseM3u8Domain(url);
        if (!domain) {
            onError && onError("unsupported domain type");
            this.markFailedTask(uuid, StatusUnsupport);
            return;
        }

        //【Step】check and create dir
        console.log(TAG, "【Step】check and create dir");
        let mPath = this.getMoviePath(movieName);
        let ePath = this.getEpisodePath(movieName, episodeName);
        let eTsPath = ePath + "/ts";
        let esPath = this.getShortEpisodePath(movieName, episodeName);
        let cPath = ""; //cover path
        let m3u8File = ePath + "/index_remote.m3u8";
        let dirExist = await RNFS.exists(ePath);
        if (dirExist == false) {
            await RNFS.mkdir(ePath);
        }
        let tsDirExsit = await RNFS.exists(eTsPath);
        if (tsDirExsit == false) {
            await RNFS.mkdir(eTsPath);
        }
        //【Step】save movie info
        await this._saveMovieInfo(info, mPath);

        //【Step】download movie cover
        cPath = await this._saveMovieCover(cover, uuid, mPath, onError);

        //【Step】parse m3u8 file
        let [realm3u8url, m3u8FileContent, parseM3U8Error] = await this._parseM3U8File(url, m3u8File);
        if (parseM3U8Error != undefined) {
            onError && onError(parseM3U8Error);
            this.markFailedTask(uuid, StatusUnsupport);
        }
        let { tsList, downloadedTsList, missedTsList } = await this._checkTsFiles(ePath, m3u8FileContent);
        // console.log(tsList, downloadedTsList, missedTsList);
        if (!tsList) {
            onError && onError("parse-ts failed");
            this.markFailedTask(uuid, StatusUnsupport);
            return;
        }
        //【Step】download ts files
        let totalTsCount = tsList.length;
        let downloadingTsList = [];  //即将下载 ts 列表默认是解析的m3u8文件ts列表，如果是恢复下载、则是 missedTsList
        //下载成功的ts数量
        downloadedTsCount = downloadedTsList.length;
        //404的ts数量
        lostTsCount = 0;
        //允许丢失的ts数量
        maxSafeLostTsCount = Math.floor(totalTsCount * this.maxSafeLostTsPercent);
        downloadingTsList = missedTsList;

        // downloadingTsList.splice(10,downloadingTsList.length) // ATTETION : comment this line for production mode
        for (let i = 0; i < downloadingTsList.length; i++) {
            let rawts = downloadingTsList[i];
            let ts = rawts;
            if (Array.isArray(rawts) && rawts.length > 0) {  //这里可能因为 hermese 编译器的缘故，downloadingTsList数组取得的元素依然是数组
                ts = rawts[0];
            }
            if (stopNow) {
                onError && onError("downloading canceled");
                break;
            }
            if (pauseNow) {
                //暂停下载任务
                break;
            }
            let [tsurl, tsname, error] = JoinURLs(realm3u8url, ts);
            if (error != undefined) {
                onError && onError("unexpected ts path parse error");
                this.markFailedTask(uuid, StatusUnsupport);
                stopNow = true;
            }
            let tspath = ePath + "/ts/" + tsname;
            // ts文件链接 ，ts文件本地存储路径 ， ts文件的名字
            await _downloadTSFile(tsurl, tspath, tsname,
                () => {
                    // download success
                    downloadedTsCount += 1;
                    let progress = parseFloat((downloadedTsCount / totalTsCount).toFixed(4));
                    onProgress && onProgress(progress);
                    this.updateTaskProgress(uuid, progress);
                },
                (e) => {
                    // download failed
                    onError && onError(e);
                    stopNow = true;
                },
                () => {
                    // download file lost , usually 404
                    lostTsCount += 1;
                    if (lostTsCount > maxSafeLostTsCount) {
                        stopNow = true;
                    }
                },
            );
        }
        if (pauseNow) {
            //暂停任务,跳过后续操作
            return;
        }
        //【Step】verify downloaded ts files
        console.log(TAG, "【Step】verify downloaded ts files");
        if (downloadedTsCount == totalTsCount) {  //ATTENTION : replace <= to == for production mode
            downloadedTsCount = 0;
            lostTsCount = 0;
            _generateM3u8Index(m3u8FileContent, tsList, esPath, ePath);
        } else {
            //missed some ts files
            //可能因为某ts下载失败，也可能是因为ts404文件过多
            onError && onError("download failed");
            if (lostTsCount >= maxSafeLostTsCount) {
                this.markFailedTask(uuid, FormatStatusMsg(StatusFailed, StatusMsgUnstable));
            } else {
                this.markFailedTask(uuid);
            }
            return;
        }
        //【Step】cached movie info summary
        // ios access url , android access url , cover
        console.log(TAG, "【Step】cached movie info summary");
        let index_url = "";
        let index_path = "";
        if (isAndroid) {
            index_url = ePath + "/index_local.m3u8";
            index_path = index_url;
        } else {
            index_url = this.hlsServer + esPath + "/index_local.m3u8";
            index_path = ePath + "/index_local.m3u8";
        }
        let cover_path = cPath;
        // console.log(TAG,'movie info summary: ',{movieName,episodeName,index_url,index_path,cover: cover_path})
        onSuccess && onSuccess({ movieName, episodeName, index_url, index_path, cover: cover_path });
        this.onSuccessCallback(movieName, episodeName, index_url, ePath);
        this.removeTask(uuid);
    }

    async _saveMovieInfo(info, moviePath) {
        if (info) {
            let iPath = moviePath + "/movieinfo";
            let infoExisted = await RNFS.exists(iPath);
            if (infoExisted == false) {
                let info_str = JSON.stringify(info);
                RNFS.writeFile(iPath, info_str);
            }
        }
    }

    async _saveMovieCover(cover, uuid, moviePath, onError) {
        if (cover && cover.length > 0) {
            let cExt = CheckImageSuffix(cover);
            if (cExt == "") {
                onError && onError("invalid cover-url");
                this.markFailedTask(uuid);
            }
            let cPath = moviePath + "/cover" + cExt;
            let coverExisted = await RNFS.exists(cPath);
            if (coverExisted == false) {
                await RNFS.downloadFile({ fromUrl: cover, toFile: cPath });
            } // else cover existed
            return cPath;
        }
        return "";
    }

    //该方法仅负责将remote播放链接解析出真正含有 ts 路径的m3u8地址、将对应m3u8下载到本地文件、返回其中的内容(含ts)
    //这里如果有嵌套m3u8，需要返回真实m3u8文件链接
    // return [ m3u8 url ,  m3u8 file content , error ];
    async _parseM3U8File(url, file) {
        if (this.m3u8ParseDeepCount == 0) {
            this.m3u8ParseDeepCount = this.maxM3u8ParseDeepCount;
            return ["", "", "不支持下载该类型文件"];
        }
        await RNFS.downloadFile({ fromUrl: url, toFile: file }).promise;
        let m3u8FileContent = await RNFS.readFile(file);
        let m3u8FileContentLines = m3u8FileContent.split("\n");
        let nestedUrl = { url: "", abs: false };
        for (let l of m3u8FileContentLines) {
            if (l.indexOf(".m3u8") != -1) {
                let abs = CheckIfUrlAbsolute(l);
                nestedUrl.url = l;
                nestedUrl.abs = abs;
            }
        }
        if (nestedUrl.url != "") { //例如: 1500kb/hls/index.m3u8
            //非 ts 文件，依然是m3u8地址
            await RNFS.unlink(file);
            if (nestedUrl.abs) {
                return await this._parseM3U8File(nestedUrl.url, file);
            } else {
                //这里不能简单的拼接新的m3u8地址到原地址（去尾后），需要做域名重叠部分排查工作
                //这里的 newurl 就是真实包含ts文件的m3u8地址，后续ts的路径拼接也要用这个新的url
                let [newurl, newurlname, error] = JoinURLs(url, nestedUrl.url);
                if (error == undefined) {
                    return await this._parseM3U8File(newurl, file);
                } else {
                    return ["", "", "不支持下载该类型文件"];
                }
            }
        } else {
            //当前链接是包含了ts文件的真实m3u8链接，直接返回该链接和文件内容
            this.m3u8ParseDeepCount = this.maxM3u8ParseDeepCount;
            return [url, m3u8FileContent, undefined];
        }
    }

    // return [ ts list , missed ts list , downloaded ts list ];
    async _checkTsFiles(ePath, content) {
        let index_remote = ePath + "/index_remote.m3u8";
        let tsDir = ePath + "/ts";
        let m3u8FileContent = "";
        if (content) {
            m3u8FileContent = content;
        } else {
            m3u8FileContent = await RNFS.readFile(index_remote);
        }
        let tsList = await ParseM3u8Content(m3u8FileContent);
        let missedTsList = []; //缺失的ts文件
        let downloadedTsList = []; //下载好的ts文件

        let epiDirTsFiles = [];//剧集文件夹下面的 子文件/文件夹
        try {epiDirTsFiles = await RNFS.readDir(tsDir);} catch (e) {}
        let tsCount = 0;
        if (epiDirTsFiles.length > 0) {
            let epiDirTsFileNames = [];            //子文件/文件夹 的名字
            for (let t of epiDirTsFiles) {
                epiDirTsFileNames.push(t.name);
                tsCount += 1;
            }
            if (tsCount != tsList?.length) {
                //missed some ts files, find'em out
                for (let t of tsList) {
                    let existed = false;
                    for (let f of epiDirTsFileNames) {
                        if (t.indexOf(f) != -1) {
                            existed = true;
                            break;
                        }
                    }
                    if (existed) {
                        downloadedTsList.push(t);
                    } else {
                        //missed this ts file
                        missedTsList.push(t);
                    }
                }
                //将downloaded ts list最后一个ts文件放入missed ts files中重新下载
                if (downloadedTsList.length > 0) {
                    let ind = downloadedTsList.length - 1;
                    let ts = downloadedTsList.splice(ind, 1);
                    missedTsList.splice(0, 0, ts);
                }
            } else {
                //剧集完整
                downloadedTsList = tsList;
            }
        } else {
            missedTsList = tsList;
        }
        return { tsList, missedTsList, downloadedTsList };
    }

    //@func scan local videos
    async scanCachedVideos() {
        let cachedVideos = [];
        let dirItems = [];
        try {
            dirItems = await RNFS.readDir(this.cacheDir);
        } catch (error) {
        }
        if (dirItems.length == 0) return cachedVideos;
        for (let i of dirItems) {
            // each dir represents a movie
            if (i.isFile()) {
                continue;
            }
            let base64_name = i.name;
            let name = decode(base64_name); // mnafdskfjal 【decode】 => XXX
            let cachedVideo = await this.scanSpecificVideo(name);
            if (cachedVideo != null) {
                cachedVideos.push(cachedVideo);
            }
        }
        return cachedVideos;
    }

    //@func scan specific video
    async scanSpecificVideo(movieName) {
        let path = this.getMoviePath(movieName);
        let episodes = []; //剧集数组
        let valideEpisodes = []; //有效剧集数组
        let invalideEpisodes = []; //无效剧集数组 (未下载完全的)
        let cover_path = "";
        let movie_info = null;

        let exist = await RNFS.exists(path);
        if (exist == false) {
            return null;
        }
        //@扫描影片下面对应的集数__并且对每一集的数据进行校验__判断ts是否完整
        //ts不完整的剧集就是下载意外中断、下载失败的剧集
        let mSubDirs = []; //电影文件夹下所有子文件/文件夹
        try {mSubDirs = await RNFS.readDir(path);} catch (e) {}
        if (mSubDirs.length > 0) {
            for (let e of mSubDirs) {
                if (e.isFile()) {
                    //文件
                    if (e.name.indexOf("cover") != -1) {
                        cover_path = e.path;
                    } else if (e.name.indexOf("movieinfo") != -1) {
                        let iPath = e.path;
                        try {
                            let infoContent = await RNFS.readFile(iPath);
                            movie_info = JSON.parse(infoContent);
                        } catch (error) {
                            console.log(TAG, "读取/解析电影信息文件", "失败,", error);
                        }
                    }
                    continue;
                }
                //文件夹,这里只能是剧集文件夹，所以无需额外判断
                let epi = {
                    name: parseInt(e.name),
                    path: e.path,
                    url: "",
                    tsIntegrity: false,
                    valide: false,
                    downloadedTs: [],
                    missedTs: [],
                };
                let index_local = e.path + "/index_local.m3u8";
                let index_remote = e.path + "/index_remote.m3u8";
                let indexExist = await RNFS.exists(index_remote);
                let indexLExist = await RNFS.exists(index_local);
                if (indexExist) {
                    if (indexLExist) {
                        //本地index文件是否存在
                        if (isAndroid) {
                            epi.url = index_local;
                        } else {
                            let esPath = this.getShortEpisodePath(movieName, e.name);
                            epi.url = this.hlsServer + esPath + "/index_local.m3u8";
                        }
                    }
                    let m3u8FileContent = await RNFS.readFile(index_remote);
                    let { tsList, missedTsList, downloadedTsList } = await this._checkTsFiles(e.path, m3u8FileContent);
                    // console.log('checkTsFiles拿到的数据: ',tsList,missedTsList,downloadedTsList)
                    let totalTsCount = tsList.length;
                    let maxSafeLostTsCount = Math.floor(totalTsCount * this.maxSafeLostTsPercent);
                    if ((downloadedTsList.length+missedTsList.length) == totalTsCount && missedTsList.length <= maxSafeLostTsCount && totalTsCount > 0) {
                        epi.tsIntegrity = true;
                    }
                    epi.downloadedTs = downloadedTsList;
                    epi.missedTs = missedTsList;
                }
                if (indexExist && epi.tsIntegrity) {
                    epi.valide = true;
                }
                episodes.push(epi);
                if (epi.valide) {
                    valideEpisodes.push(epi);
                } else {
                    invalideEpisodes.push(epi);
                }
            }
        }
        let cachedVideo = {
            name: movieName,
            cover: cover_path,
            info: movie_info,
            episodes: episodes,
            valideEpisodes: valideEpisodes,
            invalideEpisodes: invalideEpisodes,
        };
        return cachedVideo;
    }

    setData(data) {
        this.data = [...data];
    }

    //@func delete video dir
    async deleteMovie(movieName, onSuccess, onError) {
        let moviePath = this.getMoviePath(movieName);
        try {
            await RNFS.unlink(moviePath);
            let _d = [...this.data];
            for (let i = 0; i < _d.length; i++) {
                if (_d[i].name == movieName) {
                    _d.splice(i, 1);
                    break;
                }
            }
            this.setData(_d);
            onSuccess && onSuccess();
        } catch (error) {
            onError && onError(error);
        }
    }

    //@func delete video
    async deleteEpisode(movieName, episodeName, onSuccess, onError) {
        let episodePath = this.getEpisodePath(movieName, episodeName);
        try {
            await RNFS.unlink(episodePath);
            runInAction(() => {
                let _d = [...this.data];
                for (let i = 0; i < _d.length; i++) {
                    if (_d[i].name == movieName) {
                        //finded the target movie
                        for (let n = 0; n < _d[i].episodes.length; n++) {
                            if (_d[i].episodes[n].name == episodeName) {
                                _d[i].episodes.splice(n, 1);
                                break;
                            }
                        }
                        for (let n = 0; n < _d[i].valideEpisodes.length; n++) {
                            if (_d[i].valideEpisodes[n].name == episodeName) {
                                _d[i].valideEpisodes.splice(n, 1);
                                break;
                            }
                        }
                        break;
                    }
                }
                this.setData(_d);
            })
            onSuccess && onSuccess();
        } catch (error) {
            onError && onError(error);
        }
    }

    //@func delete by path
    deleteWithPath(path) {
        return RNFS.unlink(path);
    }

    //@func get storage info
    getStorageInfo() {
        return RNFS.getFSInfo();
    }

    setOnCachingTasks(uuids) {
        this.onCachingTasks = [...uuids];
    }

    setMaxCachingTaskCount(count) {
        this.maxCachingTaskCount = count;
    }

    setCacheTasks(tasks) {
        this.cacheTasks = [...tasks];
        //存入storage
        setItem(StorageKey, tasks);
    }

    // remove task
    removeTask(uuid) {
        let _cacheTasks = [...this.cacheTasks];
        for (let ind = 0; ind < _cacheTasks.length; ind++) {
            if (uuid == _cacheTasks[ind].uuid) {
                //abort task first;
                this.cacheTasks[ind].payload.abortController.abort();
                //remove from tasks list
                _cacheTasks.splice(ind, 1);

                //remove from caching list
                let uind = this.onCachingTasks.indexOf(uuid);
                if (uind != -1) {
                    let _cachingTasks = [...this.onCachingTasks];
                    _cachingTasks.splice(uind, 1);
                    this.onCachingTasks = _cachingTasks;
                    this.setOnCachingTasks(_cachingTasks);
                }
                this.setCacheTasks(_cacheTasks);
                break;
            }
        }


    }

    //重新开始失败的任务
    restartTask(task) {
        let _cacheTasks = [...this.cacheTasks];
        for (let t of _cacheTasks) {
            if (t.uuid == task.uuid) {
                t.status = StatusCaching;
                break;
            }
        }
        this.setCacheTasks(_cacheTasks);
        this.downloadEpisode(task);
    }

    //暂停下载任务
    pauseTask(task) {
        let _cacheTasks = [...this.cacheTasks];
        let ind = -1;
        for (let i = 0; i < _cacheTasks.length; i++) {
            if (_cacheTasks[i].uuid == task.uuid) {
                ind = i;
                break;
            }
        }
        //payload: movieName,episodeName,url,cover,abortController,onError,onProgress,onSuccess,
        _cacheTasks[ind].payload.pauseAbortController.abort();
        _cacheTasks[ind].status = StatusPaused;
        _cacheTasks[ind].payload.pauseAbortController = new AbortController();
        this.setCacheTasks(_cacheTasks);
    }

    //恢复下载任务
    resumeTask(task) {
        console.log('恢复任务: ',task)
        let ind = this.getTaskIndex(task.uuid);
        let _cacheTasks = [...this.cacheTasks];
        _cacheTasks[ind].status = StatusCaching;
        this.setCacheTasks(_cacheTasks);
        this.downloadEpisode(_cacheTasks[ind], true);
    }

    //添加下载任务
    addDownloadTask(taskPayloads) {
        let _newCacheTasks = [];
        for (let tp of taskPayloads) {
            tp.pauseAbortController = new AbortController();
            let _task = {
                uuid: this.taskUUID,
                status: StatusWaiting,
                payload: tp,
            };
            _newCacheTasks.push(_task);
            this.taskUUID += 1;
        }
        let _cacheTasks = [...this.cacheTasks, ..._newCacheTasks];
        this.setCacheTasks(_cacheTasks);
    }

    //更新任务下载进度
    updateTaskProgress(uuid, progress) {
        let _progress = { ...this.onCachingTasksProgress };
        _progress[uuid.toString()] = progress;
        this.onCachingTasksProgress = _progress;
    }

    //标记任务状态为（失败）
    markFailedTask(uuid, status) {
        let _cacheTasks = [...this.cacheTasks];
        for (let t of _cacheTasks) {
            if (t.uuid == uuid) {
                if (status != undefined) {
                    t.status = status;
                } else {
                    t.status = StatusFailed;
                }
            }
            this.setCacheTasks(_cacheTasks);
            break;
        }
    }

    //获取task在 cacheTasks 中的 index
    getTaskIndex(uuid) {
        for (let i = 0; i < this.cacheTasks.length; i++) {
            if (this.cacheTasks[i].uuid == uuid) {
                return i;
            }
        }
        return -1;
    }

    async onSuccessCallback(movieName, episodeName, url, ePath) {
        let _data = [...this.data];
        let existed = false;
        for (let m of _data) {
            if (m.name == movieName) {
                //movie existed , only update episode list
                //episodes, valideEpisodes
                let epi = {
                    name: episodeName,
                    path: ePath,
                    url: url,
                    tsIntegrity: true,
                    valide: true,
                };
                let ind = -1;
                for (let i = 0; i < m.episodes.length; i++) {
                    if (m.episodes[i].name == episodeName) {
                        ind = i;
                        break;
                    }
                }
                if (ind != -1) {
                    //存在旧数据，先清除旧的，再更新
                    m.episodes.splice(ind, 1);
                    m.episodes.splice(ind, 0, epi);
                    let vind = -1;
                    for (let i = 0; i < m.valideEpisodes.length; i++) {
                        if (m.valideEpisodes[i].name == episodeName) {
                            vind = i;
                            break;
                        }
                    }
                    m.valideEpisodes.splice(vind, 1);
                    m.valideEpisodes.splice(vind, 0, epi);
                } else {
                    //无旧剧集数据，直接插入数据
                    m.episodes.push(epi);
                    m.valideEpisodes.push(epi);
                }
                runInAction(() => {
                    this.data = _data; //更新data数据
                });
                existed = true;
                break;
            }
        }
        if (!existed) {
            //no movie existed, scan the movie
            let movie = await this.scanSpecificVideo(movieName);
            if (movie != null) {
                _data.push(movie);
                runInAction(() => {
                    this.data = _data;
                });
            }
        }
    }

    onDownloadStartCallback(uuid,tInd) { //任务加入正在缓存数组,修改缓存数组任务状态为 StatusCaching
        let _onCachingTasks = [...this.onCachingTasks];
        _onCachingTasks.push(uuid);
        this.setOnCachingTasks(_onCachingTasks);

        let _cacheTasks = [...this.cacheTasks];
        _cacheTasks[tInd].status = StatusCaching;
        this.setCacheTasks(_cacheTasks);
    }
}

const cacheStore = new CacheStore();

export default cacheStore;

//解析m3u8播放链接，返回 @param1: 根域名, @param2: 按 '/' 分割得到的字符数组
function ParseM3u8Domain(url) {
    let domainReg = /http(\S)*(.com|.cn)/g;
    let rs = url.match(domainReg);
    let segs = url.split("/");
    if (rs) {
        return ({
            root: rs[0],
            segs: segs,
        });
    }
    return null;
}

//根据 '/' 分割的字符数组拼接出完整URL
function JoinUrlSegments(segs) {
    let _u = "";
    for (let i = 0; i < segs.length; i++) {
        if (i == 0) {
            _u += segs[i];
            continue;
        }
        _u = _u + "/" + segs[i];
    }
    return _u;
}

//替换字符数组最后一个
function ReplaceUrlSegmentsLastOne(str, segs) {
    if (Array.isArray(segs) == false) {
        return [segs, "invalide url splitted string-array"];
    }
    if (segs.length < 1) {
        return [segs, "empty segs"];
    }
    let _segs = [...segs];
    _segs[(_segs.length - 1)] = str;
    return [_segs, undefined];
}

//检查URL是绝对路径还是非绝对路径
function CheckIfUrlAbsolute(url) {
    return (url.indexOf("http://") != -1 || url.indexOf("https://") != -1);
}

//返回ts文件的下载链接，文件名
//domain: { root: 'http://...' , segs: [] }
//例如内涵source,    https://cdn-youku-com.diudie.com/series/19309/index.m3u8
//      ts路径      "/series/19309/0MWxvySd.ts"
//      domain     "https://cdn-youku-com.diudie.com" , [ <= , series, 19309 , index.m3u8 ]
//努努source,       https://zy.512wx.com/20170904/iOGad9qd/index.m3u8
//      ts路径      "ppvod1641000.ts"
//      domain     "https://zy.512wx.com" , [ <= , 20170904 , iOGad9qd , index.m3u8]

//将第二个url拼接至第一个url末尾，有重复部分就去除重复部分，如果第二个url为绝对路径则直接返回
function JoinURLs(url, suburl) {
    let domain = ParseM3u8Domain(url); // {root: , segs: }
    let suburlSegs = suburl.split("/");
    if (suburlSegs[0] == "") {
        suburlSegs.splice(0, 1);
    }
    let len = suburlSegs.length;
    if (CheckIfUrlAbsolute(suburl)) {
        return [suburl, suburlSegs[len - 1], undefined];
    }
    if (len == 1) {
        let [_segs, error] = ReplaceUrlSegmentsLastOne(suburlSegs[0], domain.segs);
        if (error != undefined) {
            return ["", "", error];
        }
        let _suburl = JoinUrlSegments(_segs);
        return [_suburl, suburlSegs[0], undefined];
    }
    let repeatInd = -1;
    for (let i = len - 1; i--; i >= 0) {
        let suburlseg = suburlSegs[i];
        let ind = domain.segs.indexOf(suburlseg);
        if (ind != -1) {
            repeatInd = i;
            break;
        }
    }
    if (repeatInd != -1) {
        suburlSegs.splice(0, repeatInd + 1);
    }
    let dsegs = [...domain.segs];
    dsegs.splice(dsegs.length - 1, 1);
    let _suburlsegs = [...dsegs, ...suburlSegs];
    let _suburl = JoinUrlSegments(_suburlsegs);
    return [_suburl, _suburlsegs[_suburlsegs.length - 1], undefined];
}

//解析 m3u8 文件内容，获取 ts 路径
function ParseM3u8Content(content) {
    let tsList = [];   //ts 文件路径
    let contentLines = content.split("\n");
    let lineType = "";
    for (let i = 0; i < contentLines.length; i++) {
        let line = contentLines[i];
        if (lineType == EXTINF) {
            //上一行是 ts文件信息头, 该行是 ts路径
            tsList.push(line);
            lineType = TS;
            continue;
        }
        if (line.indexOf(EXTINF) != -1) {
            //该行是 ts文件信息头, 下一行是 ts 文件
            lineType = EXTINF;
            continue;
        }
        if (line.indexOf(EXTXENDLIST) != -1) {
            //该行是 ts文件结束头
            break;
        }
    }
    return tsList;
}

function parseM3u8Content(content) { //旧版解析方法
    let tsList = content.match(TSReg);
    let tsnList = [];
    let prefix = "";
    if (tsList.length > 0) {
        for (let t of tsList) {
            t.match(TSReg);
            let n = RegExp.$3;
            tsnList.push(n);
            if (prefix == "") {
                prefix = RegExp.$1 + RegExp.$2;
            }
        }
    }
    return { tsList, tsnList, prefix };
}

function CheckImageSuffix(url) {
    let suffix = "";
    if (url.indexOf(".png") != -1) {
        suffix = ".png";
    } else if (url.indexOf(".PNG") != -1) {
        suffix = ".PNG";
    } else if (url.indexOf(".jpg") != -1) {
        suffix = ".jpg";
    } else if (url.indexOf(".JPG") != -1) {
        suffix = ".JPG";
    } else if (url.indexOf(".jpeg") != -1) {
        suffix = ".jpeg";
    } else if (url.indexOf(".JPEG") != -1) {
        suffix = ".JPEG";
    } else if (url.indexOf(".webp") != -1) {
        suffix = ".webp";
    } else if (url.indexOf(".WEBP") != -1) {
        suffix = ".WEBP";
    }
    return suffix;
}

async function _downloadTSFile(url, tofile, filename, onSuccess, onFailed, onFileLost) {
    try {
        let result = await RNFS.downloadFile({
            fromUrl: url,
            toFile: tofile,
        }).promise;
        onSuccess && onSuccess();
        if (result.statusCode >= 400) { //404
            onFileLost && onFileLost();
        }
    } catch (error) {
        onFailed && onFailed("下载失败: " + filename);
    }
}

async function _generateM3u8Index(m3u8FileContent, tsList, esPath, ePath) { //esPath为 剧集本地路径全路径，ePath为短路径
    //  "/series/19309/0MWxvySd.ts"
    //  "ppvod1641000.ts"
    let TSNewPrefix = "";
    let indexPath = ""; //m3u8文件路径
    if (isAndroid) {
        TSNewPrefix = ePath + "/";
        indexPath = ePath + "/" + "index_local.m3u8";
    } else {
        TSNewPrefix = esPath + "/";
        indexPath = ePath + "/" + "index_local.m3u8";
    }
    TSNewPrefix += "ts/";
    let content = m3u8FileContent;
    for (let ts of tsList) {
        let tssegs = ts.split("/");
        let tsn = tssegs[tssegs.length - 1];
        let tsp = TSNewPrefix + tsn;
        content = content.replace(ts, tsp);
    }
    await RNFS.writeFile(indexPath, content);
}

async function setItem(key, value, onError) {
    try {
        const v = JSON.stringify(value);
        await AsyncStorage.setItem(key, v);
    } catch (e) {
        onError && onError(e);
    }
}

async function removeItem(key, onError) {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        // remove error
        onError && onError(e);
    }
}

async function removeMultiItems(keys, onError) {
    try {
        await AsyncStorage.multiRemove(keys);
    } catch (e) {
        // remove error
        onError && onError(e);
    }
}

async function removeAllItems() {
    AsyncStorage.clear();
}

async function getItem(key, onError) {
    try {
        let str = await AsyncStorage.getItem(key);
        if (str == null) return str;
        return JSON.parse(str);
    } catch (e) {
        onError && onError(e);
        return null;
    }
}
