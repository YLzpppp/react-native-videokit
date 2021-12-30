import { observer } from 'mobx-react';
import React, { useEffect,useState } from 'react';
import {
	View,
	StyleSheet,
	SafeAreaView,
	Text,
	TouchableOpacity,
	Pressable,
} from 'react-native';
import cacheStore from '../src/cacheStore';

const Color = '#4FA7FF';
const Button = (props) => {
	return (
		<TouchableOpacity
			onPress={props.onPress}
			style={{ paddingVertical: 12, paddingHorizontal: 20 }}>
			<Text style={{ fontSize: 19, fontWeight: '500', color: '#4FA7FF' }}>
				{props.text}
			</Text>
		</TouchableOpacity>
	);
};

const VideoCachePage = observer((props) => {
	// nunu
	const url = 'https://zy.512wx.com/20170904/iOGad9qd/index.m3u8';
	// nh
	const url2 = 'https://cdn-youku-com.diudie.com/series/19309/index.m3u8';
	// kkw
	const url3 = 'https://vod2.buycar5.cn/20200910/ia8xlqMv/index.m3u8';
	//   /20200910/ia8xlqMv/1000kb/hls/index.m3u8

	const downloadM3U8 = () => {

		cacheStore.downloadEpisode({
			payload: {
				movieName: '突然回到18岁',
				episodeName: 1,
				url: url2,
				cover:
				  'https://cdn-iqiyi-com.diudie.com/app/image/image-5fbdf9fc3a6b39.51217453.jpg',
				onError: (e) => {
				  console.log('下载错误: ', e);
				},
				onSuccess: (info) => {
				  console.log('下载完成: ', info);
				},
				onProgress: (p) => {
				  console.log('下载进度:', p);
				},
			},
			uuid: 123123
		});

	};
 
	return (
		<>
			<SafeAreaView style={{ flex: 1 }}>
				<Pressable
					onPress={props.back}
					style={{ paddingHorizontal: 15, paddingVertical: 8 }}>
					<Text style={{ color: Color, fontSize: 18 }}>返回</Text>
				</Pressable>

				<View style={{ marginHorizontal: 15 }}>
					<Text style={{ marginTop: 20, fontSize: 18 }}>视频地址:</Text>
					<Text style={{ fontSize: 17, marginTop: 10 }}>{url2}</Text>
				</View>

				<Button text={'下载m3u8'} onPress={downloadM3U8} />
			</SafeAreaView>
		</>
	);
});

export default VideoCachePage;

const styles = StyleSheet.create({});
