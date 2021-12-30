import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  DeviceOrientation,
  SystemSetting,
  RealFullscreen,
} from 'react-native-videokit';

import VideoPlayerPage from './VideoPlayerPage';
import VideoCachePage from './VideoCachePage';
import {observer} from 'mobx-react';
import cacheStore from '../src/cacheStore';

const ButtonLabel = (props) => {
  return (
    <Text style={{fontSize: 19, fontWeight: '500', color: '#4FA7FF'}}>
      {props.text}
    </Text>
  );
};
const Button = (props) => {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={{paddingVertical: 12, paddingHorizontal: 20}}>
      <ButtonLabel text={props.text} />
    </TouchableOpacity>
  );
};

const App = observer((props) => {
  const [page, setpage] = useState('');
  const back = () => {
    setpage('');
  };

  useEffect(() => {
    cacheStore.init({appName: 'videokit'});
    cacheStore.initCachedVideoData();
  }, []);

  return (
    <>
      {page == '' && (
        <>
          <View style={[styles.container]}>
            <Button
              onPress={() => {
                setpage('video');
              }}
              text={'进入播放页'}
            />
            <Button
              onPress={() => {
                setpage('cache');
              }}
              text={'进入下载页'}
            />
          </View>
        </>
      )}
      {page == 'video' && <VideoPlayerPage back={back} />}
      {page == 'cache' && <VideoCachePage back={back} />}
    </>
  );
});
export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
