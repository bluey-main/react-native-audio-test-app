import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import Animated, {
  Extrapolate,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Memo } from "../../app/(tabs)/Memo";

const MemoListItem = ({ memo }: { memo: Memo }) => {
  const [sound, setSound] = useState<Sound>();
  const [status, setStatus] = useState<AVPlaybackStatus>();
  const [paused, setPaused] = useState(false);

  async function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    setStatus(status);
  }

  async function loadSound() {
    console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync(
      { uri: memo.uri },
      { progressUpdateIntervalMillis: 1000 / 60 },
      onPlaybackStatusUpdate
    );
    setSound(sound);
  }

  async function playSound() {
    if (!sound) {
      return;
    }
    console.log("Playing Sound");
    if (status?.isLoaded && status?.isPlaying) {
      await sound.pauseAsync();
      setPaused(true);
    } else if (paused) {
      await sound.playAsync();
      setPaused(false);
    } else {
      await sound.replayAsync();
    }
  }

  useEffect(() => {
    loadSound();
  }, [memo.uri]);

  useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const formatMillis = (millis: number) => {
    const minutes = Math.floor(millis / (1000 * 60));
    const seconds = Math.floor((millis % (1000 * 60)) / 1000);

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };
  const isPlaying = status?.isLoaded ? status?.isPlaying : false;
  const position = status?.isLoaded ? status?.positionMillis : 0;
  const duration = status?.isLoaded ? status?.durationMillis : 1;
  const progress = position / duration;

  // const animatedProgressIndicator = useAnimatedStyle(() => ({
  //   left: `${progress * 100}%`,
  // }));

  const lines = [];
  let numLines = 50;

  for(let i = 0; i < numLines; i++){
    const meteringIndex = Math.floor((i * memo.metering.length) / numLines);
    const nextMeteringIndex = Math.ceil(((i + 1) * memo.metering.length) / numLines);
    const values = memo.metering.slice(meteringIndex, nextMeteringIndex);
    const average = values.reduce((sum, a) => sum + a, 0) / values.length;

    console.log(average)
    lines.push(average)
  }

  // console.log(memo);
  return (
    <View style={styles.container}>
      <FontAwesome5
        name={isPlaying ? "pause" : "play"}
        size={20}
        color={"gray"}
        onPress={playSound}
      />
      <View style={styles.playbackContainer}>
        <View style={styles.wave}>
          {lines.map((db, index) => (
            <View
              key={index}
              style={[
                styles.waveLine,
                {
                  height: interpolate(
                    db,
                    [-60, 0],
                    [5, 50],
                    Extrapolation.CLAMP
                  ),
                  backgroundColor: progress > index /lines.length ? "royalblue" : 'gainsboro'
                },
              ]}
            />
          ))}
        </View>
        {/* <View style={styles.playbackBackground}></View> */}
        {/* <Animated.View
          style={[styles.playbackIndicator, animatedProgressIndicator]}
        ></Animated.View> */}
        <Text style={{ position: "absolute", right: 0, bottom: 0 }}>
          {formatMillis(position || 0)} / {formatMillis(duration || 0)}
        </Text>
      </View>
    </View>
  );
};

export default MemoListItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    margin: 5,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 30,
    gap: 10,
    borderRadius: 15,
  },

  playbackContainer: {
    flex: 1,
    height: 70,
    justifyContent: "center",
  },

  playbackBackground: {
    height: 5,
    backgroundColor: "gainsboro",
  },
  wave: {
    flexDirection: "row",
    gap: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  waveLine: {
    flex: 1,
    height: 30,
    backgroundColor: "gainsboro",
    borderRadius: 20,
  },
  playbackIndicator: {
    width: 15,
    aspectRatio: 1,
    backgroundColor: "royalblue",
    position: "absolute",
    borderRadius: 10,
  },
});
