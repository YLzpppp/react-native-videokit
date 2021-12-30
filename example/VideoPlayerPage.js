import React, { useEffect, useState } from 'react';
import {
	View,
	StyleSheet,
	SafeAreaView,
	FlatList,
	Image,
	TouchableOpacity,
	Text,
	Pressable,
	useWindowDimensions,
} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import cacheStore from '../src/cacheStore';
import { observer } from 'mobx-react';

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

const VideoPlayerPage = observer((props) => {
	const dimens = useWindowDimensions();

	const [url, seturl] = useState('');

	const renderItem = ({ item, index }) => {
		return (
			<View style={{ flexDirection: 'row', marginHorizontal: 12 }}>
				<Image
					source={{ uri: item.cover }}
					style={{ height: 80, width: 50, borderWidth: 1, borderColor: '#777' }}
					resizeMode={'contain'}
				/>
				<View style={{ flex: 1, marginStart: 10 }}>
					{item.episodes.map((v, i) => {
						return (
							<Pressable
								key={i.toString()}
								onPress={() => {
									seturl(v.url);
								}}
								style={{paddingVertical: 12,borderWidth: 1,borderColor: '#f1f1f1',width: '100%',}}>
								<Text style={{ marginStart: 10 }}>{v.name}</Text>
							</Pressable>
						);
					})}
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<Pressable
				onPress={props.back}
				style={{ paddingHorizontal: 15, paddingVertical: 8 }}>
				<Text style={{ color: Color, fontSize: 18 }}>返回</Text>
			</Pressable>

			<View style={{ width: dimens.width, height: (dimens.width * 3) / 5 }}>
				<Video
					source={{ uri: url }}
					repeat={false}
					paused={false}
					volume={1}
					style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#000' }}
				/>
			</View>
			<FlatList
				data={cacheStore.data}
				keyExtractor={(item, index) => index.toString()}
				renderItem={renderItem}
			/>
		</SafeAreaView>
	);
});
export default VideoPlayerPage;

const styles = StyleSheet.create({});
