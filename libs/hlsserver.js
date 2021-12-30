import React from 'react';
import { NativeModules,Platform } from 'react-native';

const isAndroid = Platform.OS == 'android';

const HLSServerModule = isAndroid ? null : NativeModules.HLSServerModule;

const startHLSServer = (directory, callback) => {
    if(!isAndroid){
        HLSServerModule.startHLSServer(directory, callback)
    }
}
const startHLSServerWithPort = (directory, port, callback) => {
    if(!isAndroid){
        HLSServerModule.startHLSServerWithPort(directory, port, callback)
    }
}
export { startHLSServer,startHLSServerWithPort }