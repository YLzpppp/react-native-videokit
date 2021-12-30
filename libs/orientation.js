import { NativeModules,Platform, NativeEventEmitter } from 'react-native';
const Orientation = NativeModules.DeviceOrientation;
const Emitter = new NativeEventEmitter(Orientation);

//粗精度方向： 竖直 或 横向 监听事件
const coarseOrientationDidChange = "coarseOrientationDidChange";
//高精度方向监听事件
const specificOrientationDidChange = "specificOrientationDidChange";

var listeners = {};
var id = 0;
var META = '__listener_id';
const getKey = (listener) => {
    if (!listener.hasOwnProperty(META)) {
        if (!Object.isExtensible(listener)) {
            return 'F';
        }
        Object.defineProperty(listener, META, {
            value: 'L' + ++id,
        });
    }
    return listener[META];
};

const getOrientation = (cb) => {
    Orientation.getOrientation((error, orientation) => {
        cb(error, orientation);
    });
};

const getSpecificOrientation = (cb) => {
    Orientation.getSpecificOrientation((error, orientation) => {
        cb(error, orientation);
    });
}

const lockToPortrait = () => {
    Orientation.lockToPortrait();
};

const lockToLandscape = () => {
    Orientation.lockToLandscape();
};

const lockToLandscapeRight = () => {
    Orientation.lockToLandscapeRight();
};

const lockToLandscapeLeft = () => {
    Orientation.lockToLandscapeLeft();
};

const unlockAllOrientations = () => {
    Orientation.unlockAllOrientations();
};
const unlockAllOrientationsButUpsidedown = () => {
    if(Platform.OS == 'ios'){
        Orientation.unlockAllOrientationsButUpsidedown();
    }else{
        unlockAllOrientations();
    }
};

const getInitialOrientation = () => {
    return Orientation.initialOrientation;
}

const addOrientationListener = (cb) => {
    var key = getKey(cb);
    listeners[key] = Emitter.addListener(coarseOrientationDidChange,
        (body) => {
            cb(body.coarseOrientation);
        });
}
const removeOrientationListener = (cb) => {
    var key = getKey(cb);
    if (!listeners[key]) {
        return;
    }
    listeners[key].remove();
    listeners[key] = null;
}
const addSpecificOrientationListener = (cb) => {
    var key = getKey(cb);
    listeners[key] = Emitter.addListener(specificOrientationDidChange,
        (body) => {
            cb(body.specificOrientation);
        });
}
const removeSpecificOrientationListener = (cb) => {
    var key = getKey(cb);
    if (!listeners[key]) {
        return;
    }
    listeners[key].remove();
    listeners[key] = null;
}

const OrientationModule = {
    getOrientation:getOrientation,
    getSpecificOrientation:getSpecificOrientation,
    lockToPortrait:lockToPortrait,
    lockToLandscape:lockToLandscape,
    lockToLandscapeRight:lockToLandscapeRight,
    lockToLandscapeLeft:lockToLandscapeLeft,
    unlockAllOrientations:unlockAllOrientations,
    unlockAllOrientationsButUpsidedown:unlockAllOrientationsButUpsidedown,
    getInitialOrientation:getInitialOrientation,
    addOrientationListener:addOrientationListener,
    removeOrientationListener:removeOrientationListener,
    addSpecificOrientationListener:addSpecificOrientationListener,
    removeSpecificOrientationListener:removeSpecificOrientationListener,
};
export default OrientationModule;
export {
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
