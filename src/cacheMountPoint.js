import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react'
import cacheStore,{ Status } from './cacheStore';
import { InteractionManager } from 'react-native';

const CacheMountPoint = observer((props) => {

    const options = props.options;

    useEffect(() => {
        if(options && options.appName){
            cacheStore.init({appName: options.appName});
            InteractionManager.runAfterInteractions(() => {
                cacheStore.initCachedVideoData();
            })
        }
    },[])

    //当正在缓存队列任务数量小于最大并行时，将等待队列中的任务放入缓存任务队列
    useEffect(() => {
        let max = cacheStore.maxCachingTaskCount;
        let len = cacheStore.onCachingTasks.length;
        if(len < max && cacheStore.cacheTasks.length > len) {
            for(let t of cacheStore.cacheTasks){
                //判断下载中任务是否达到最大值
                if(cacheStore.onCachingTasks.length == cacheStore.maxCachingTaskCount){
                    break;
                }
                //当前任务是否是在”正在下载“队列中
                let isCaching = cacheStore.onCachingTasks.indexOf(t.uuid) != -1;
                if(isCaching) { continue }
                //当前任务是否是”下载失败“状态
                let isFailed = t.status.code == Status.failed.code;
                if(isFailed) { continue }
                //当前任务是否是“ 暂停 "状态
                //TODO: add resume-feature

                //当前任务是否是” 等待下载“状态
                if(t.status.code == Status.waiting.code){
                    //添加进下载队列
                    let _cachingTasks = [...cacheStore.onCachingTasks];
                    _cachingTasks.push(t.uuid);
                    cacheStore.setOnCachingTasks(_cachingTasks);
                    //开始执行下载
                    cacheStore.downloadEpisode(t);
                }
            }
        }
    },[cacheStore.onCachingTasks,cacheStore.cacheTasks])

    return <></>
});
export default CacheMountPoint;
