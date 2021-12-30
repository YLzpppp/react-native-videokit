import { NativeModules,Platform } from 'react-native';
const isAndroid = Platform.OS === 'android';

const { RealFullscreen } = NativeModules;
const RNHomeIndicator = isAndroid ? null : NativeModules.RNHomeIndicator ;

const toggleFullscreen = (on) => {
    if(isAndroid){
        RealFullscreen.toggleFullscreen(on);
    }else{
        RNHomeIndicator.setAutoHidden(on)
    }
}

const toggleImmerseStatusBar = () => {
    if(isAndroid){
        RealFullscreen.toggleImmerseStatusBar();
    }
}

export {
    toggleFullscreen,
    toggleImmerseStatusBar
};