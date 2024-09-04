import { useState } from "react";
import {
  View,
  StyleSheet,
  Button,
  FlatList,
  Text,
  SafeAreaView,
  Pressable,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Recording } from "expo-av/build/Audio";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import MemoListItem from "@/components/Memo/MemoListItem";


export type Memo = {
  uri:string;
  metering:number[];
}
export default function MemoScreen() {
  const [recording, setRecording] = useState<Recording>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [audioMetering, setAudioMetering] = useState<number[]>([])
  const [status, setStatus] = useState<AVPlaybackStatus>();

  const metering = useSharedValue(-100)

  async function startRecording() {
    try {
      setAudioMetering([])
      
      if (permissionResponse.status !== "granted") {
        console.log("Requesting permission..");
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY, undefined, 1000 / 60
      );
      setRecording(recording);
      console.log("Recording started");

      recording.setOnRecordingStatusUpdate((status) => {
        console.log(status);
        if (status.metering) {
        metering.value = status.metering;
        setAudioMetering((prevValue) => [...prevValue, status.metering || -100])
          
        }
      });
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    if (!recording) {
      return;
    }
    console.log("Stopping recording..");
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);
    metering.value = -100
    if (uri) {
      setMemos((existingMemos) => [{uri, metering:audioMetering}, ...existingMemos]);
      setAudioMetering([])
    }
  }

  const animatedRedCircle = useAnimatedStyle(() => ({
    width: withSpring(recording ? "50%" : "100%"),
    borderRadius: withTiming(recording ? 5 : 70),
  }));

  const animatedRecordWave = useAnimatedStyle(() => {
    const size = withTiming(interpolate(metering.value, [-160, -60, 0], [0, 0, -30]), {duration:250})
    return {
      top:size,
      bottom:size,
      left:size,
      right:size,
    }
  })
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={memos}
        renderItem={({ item }) => <MemoListItem memo={item} />}
      />
      <View style={styles.footer}>
        <View>
      <Animated.View style={[styles.recordWave, animatedRecordWave]} />

        <Pressable
          style={styles.recordButton}
          onPress={recording ? stopRecording : startRecording}
        >
          <Animated.View
            style={[styles.redCircle, animatedRedCircle]}
          ></Animated.View>

        </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    padding: 10,
  },
  footer: {
    height: 200,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    borderColor: "gray",
    borderWidth: 3,
    borderRadius: 50,
    padding: 3,
    height: 70,
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },

  recordWave: { 
    backgroundColor: "#FF000055",
    position:'absolute',
    top: -20,
    bottom:-20,
    right: -20,
    left:-20,
    borderRadius:1000,
  },
  redCircle: {
    backgroundColor: "orangered",
    aspectRatio: 1,
    borderRadius: 50,
  },
});
