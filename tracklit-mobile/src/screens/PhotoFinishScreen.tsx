import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  FlatList,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  UploadSimple,
  Timer,
  FloppyDisk,
  X,
  Trash,
  VideoCamera,
  Person,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Card, CardContent } from '@/components/ui/Card';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { MediaPipeBridge, type MediaPipeBridgeRef, type PoseLandmark } from '@/components/MediaPipeBridge';
import { PoseOverlay } from '@/components/PoseOverlay';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCRUB_HEIGHT = 56;
const THUMB_SIZE = 24;
const LIBRARY_STORAGE_KEY = '@photofinish_library';

interface ClockOverlay {
  id: string;
  x: number;
  y: number;
  startFrame: number;
}

interface SavedVideo {
  id: string;
  uri: string;
  fileName: string;
  savedAt: number;
}

export const PhotoFinishScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const videoRef = useRef<Video>(null);

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [frameRate, setFrameRate] = useState(30);
  const [showFpsMenu, setShowFpsMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const durationRef = useRef(0);

  const [clockMode, setClockMode] = useState(false);
  const [clockOverlays, setClockOverlays] = useState<ClockOverlay[]>([]);

  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);

  const mediaPipeRef = useRef<MediaPipeBridgeRef>(null);
  const [poseEnabled, setPoseEnabled] = useState(false);
  const [poseLandmarks, setPoseLandmarks] = useState<PoseLandmark[] | null>(null);
  const [poseProcessing, setPoseProcessing] = useState(false);
  const [videoLayout, setVideoLayout] = useState({ width: 0, height: 0 });

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const data = await AsyncStorage.getItem(LIBRARY_STORAGE_KEY);
      if (data) setSavedVideos(JSON.parse(data));
    } catch {}
  };

  const saveToLibrary = async () => {
    if (!videoUri) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save videos.');
        return;
      }

      await MediaLibrary.saveToLibraryAsync(videoUri);

      const fileName = videoFileName || `photo_finish_${Date.now()}.mp4`;
      const entry: SavedVideo = {
        id: Date.now().toString(),
        uri: videoUri,
        fileName,
        savedAt: Date.now(),
      };

      const updated = [...savedVideos, entry];
      setSavedVideos(updated);
      await AsyncStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated));
      Alert.alert('Saved', 'Video saved to your library.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save video.');
    }
  };

  const deleteFromLibrary = async (id: string) => {
    const updated = savedVideos.filter((v) => v.id !== id);
    setSavedVideos(updated);
    await AsyncStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleUpload = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setVideoUri(asset.uri);
        setVideoFileName(asset.fileName || `video_${Date.now()}.mp4`);
        setClockOverlays([]);
        setCurrentPosition(0);
        setIsLoaded(false);
        setShowLibrary(false);
      }
    } catch {
      Alert.alert('Error', 'Unable to access video library.');
    }
  }, []);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setCurrentPosition(status.positionMillis);
    setIsPlaying(status.isPlaying);
    if (!isLoaded && status.durationMillis) {
      setDuration(status.durationMillis);
      durationRef.current = status.durationMillis;
      setIsLoaded(true);
    }
  }, [isLoaded]);

  const doScrub = useCallback(async (xRatio: number) => {
    const dur = durationRef.current;
    if (!videoRef.current || !dur) return;
    const pos = Math.max(0, Math.min(dur, xRatio * dur));
    await videoRef.current.setPositionAsync(pos, { toleranceMillisBefore: 0, toleranceMillisAfter: 0 });
    setCurrentPosition(pos);
  }, []);

  const scrubPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        doScrub(x / SCREEN_WIDTH);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.pageX;
        doScrub(x / SCREEN_WIDTH);
      },
    })
  ).current;

  const runPoseDetection = useCallback(async () => {
    if (!videoUri || !mediaPipeRef.current || poseProcessing) return;
    setPoseProcessing(true);
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: currentPosition,
        quality: 0.8,
      });

      const base64 = await fetch(uri)
        .then(r => r.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        }));

      const landmarks = await mediaPipeRef.current.detectPose(base64);
      setPoseLandmarks(landmarks);
    } catch {
      setPoseLandmarks(null);
    }
    setPoseProcessing(false);
  }, [videoUri, currentPosition, poseProcessing]);

  useEffect(() => {
    if (poseEnabled && isLoaded && !isPlaying) {
      runPoseDetection();
    }
  }, [poseEnabled, currentPosition, isLoaded, isPlaying]);

  const handleVideoTap = useCallback((evt: GestureResponderEvent) => {
    if (clockMode) {
      const { locationX, locationY } = evt.nativeEvent;
      const currentFrame = Math.round((currentPosition / 1000) * frameRate);
      const overlay: ClockOverlay = {
        id: Date.now().toString(),
        x: locationX,
        y: locationY,
        startFrame: currentFrame,
      };
      setClockOverlays((prev) => [...prev, overlay]);
      setClockMode(false);
      return;
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  }, [clockMode, currentPosition, frameRate, isPlaying]);

  const removeOverlay = (id: string) => {
    setClockOverlays((prev) => prev.filter((o) => o.id !== id));
  };

  const currentFrame = Math.round((currentPosition / 1000) * frameRate);
  const progress = duration > 0 ? currentPosition / duration : 0;

  const formatTime = (ms: number) => {
    const totalSecs = ms / 1000;
    const mins = Math.floor(Math.abs(totalSecs) / 60);
    const secs = Math.abs(totalSecs) % 60;
    const sign = totalSecs < 0 ? '-' : '';
    return `${sign}${mins}:${secs.toFixed(2).padStart(5, '0')}`;
  };

  const getOverlayTime = (overlay: ClockOverlay) => {
    const frameDiff = currentFrame - overlay.startFrame;
    const timeDiff = (frameDiff / frameRate) * 1000;
    return formatTime(timeDiff);
  };

  const openSavedVideo = (video: SavedVideo) => {
    setVideoUri(video.uri);
    setVideoFileName(video.fileName);
    setClockOverlays([]);
    setCurrentPosition(0);
    setIsLoaded(false);
    setShowLibrary(false);
  };

  if (showLibrary) {
    return (
      <LinearGradient
        colors={theme.gradient.background}
        locations={theme.gradient.locations}
        style={styles.container}
      >
        <View style={[styles.libraryContainer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.libraryHeader}>
            <TouchableOpacity onPress={() => setShowLibrary(false)} style={styles.headerBtn}>
              <ArrowLeft size={22} color={theme.colors.foreground} weight="bold" />
            </TouchableOpacity>
            <Text variant="h3" weight="bold" color="foreground">Saved Videos</Text>
            <View style={styles.headerBtn} />
          </View>

          {savedVideos.length === 0 ? (
            <View style={styles.emptyLibrary}>
              <VideoCamera size={48} color={theme.colors.textMuted} weight="fill" />
              <Text variant="body" color="muted">No saved videos yet</Text>
            </View>
          ) : (
            <FlatList
              data={savedVideos}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => openSavedVideo(item)} activeOpacity={0.8}>
                  <Card style={styles.libraryCard}>
                    <CardContent style={styles.libraryCardContent}>
                      <VideoCamera size={24} color={theme.colors.primary} weight="fill" />
                      <View style={{ flex: 1 }}>
                        <Text variant="body" weight="bold" color="foreground" numberOfLines={1}>{item.fileName}</Text>
                        <Text variant="small" color="muted">{new Date(item.savedAt).toLocaleDateString()}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert('Delete', 'Remove this video from library?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteFromLibrary(item.id) },
                          ]);
                        }}
                      >
                        <Trash size={20} color={theme.colors.destructive} weight="fill" />
                      </TouchableOpacity>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </LinearGradient>
    );
  }

  if (!videoUri) {
    return (
      <LinearGradient
        colors={theme.gradient.background}
        locations={theme.gradient.locations}
        style={styles.container}
      >
        <View style={[styles.uploadContainer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.uploadHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <ArrowLeft size={22} color={theme.colors.foreground} weight="bold" />
            </TouchableOpacity>
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.uploadArea}>
            <TouchableOpacity onPress={handleUpload} style={styles.uploadCircle} activeOpacity={0.8}>
              <UploadSimple size={40} color={theme.colors.primaryForeground} weight="fill" />
            </TouchableOpacity>
            <Text variant="h3" weight="bold" color="foreground" style={{ marginTop: 20 }}>
              Upload a Video
            </Text>
            <Text variant="body" color="muted" style={{ textAlign: 'center', marginTop: 8 }}>
              Select a race finish video to analyze frame by frame
            </Text>
          </View>

          {savedVideos.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowLibrary(true)}
              style={styles.libraryButton}
              activeOpacity={0.8}
            >
              <FloppyDisk size={20} color={theme.colors.primary} weight="fill" />
              <Text variant="body" weight="bold" color="primary">
                Saved Videos ({savedVideos.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.videoContainer}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleVideoTap}
        style={styles.videoTouchArea}
      >
        <View
          style={styles.videoWrapper}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setVideoLayout({ width, height });
          }}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          {poseEnabled && poseLandmarks && (
            <PoseOverlay
              landmarks={poseLandmarks}
              width={videoLayout.width}
              height={videoLayout.height}
            />
          )}
        </View>

        {clockOverlays.map((overlay) => (
          <TouchableOpacity
            key={overlay.id}
            style={[
              styles.clockOverlay,
              { left: overlay.x - 45, top: overlay.y - 16 },
            ]}
            onLongPress={() => removeOverlay(overlay.id)}
            activeOpacity={0.9}
          >
            <Text style={styles.clockText}>{getOverlayTime(overlay)}</Text>
          </TouchableOpacity>
        ))}

        {clockMode && (
          <View style={styles.clockModeIndicator}>
            <Text variant="small" weight="bold" style={{ color: '#FF9800' }}>
              Tap where you want the clock
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => {
            setVideoUri(null);
            setIsLoaded(false);
            setClockOverlays([]);
            setPoseEnabled(false);
            setPoseLandmarks(null);
          }}
          style={styles.topBtn}
        >
          <X size={20} color="#fff" weight="bold" />
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            onPress={() => setShowFpsMenu(!showFpsMenu)}
            style={styles.fpsBtn}
          >
            <Text style={styles.fpsBtnText}>{frameRate}fps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setPoseEnabled(!poseEnabled);
              if (!poseEnabled) setPoseLandmarks(null);
            }}
            style={[styles.topBtn, poseEnabled && styles.topBtnPose]}
          >
            <Person size={20} color={poseEnabled ? '#00FF88' : '#fff'} weight="fill" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setClockMode(!clockMode)}
            style={[styles.topBtn, clockMode && styles.topBtnActive]}
          >
            <Timer size={20} color={clockMode ? '#FF9800' : '#fff'} weight="fill" />
          </TouchableOpacity>

          <TouchableOpacity onPress={saveToLibrary} style={styles.topBtn}>
            <FloppyDisk size={20} color="#fff" weight="fill" />
          </TouchableOpacity>
        </View>
      </View>

      {showFpsMenu && (
        <View style={[styles.fpsMenu, { top: insets.top + 56 }]}>
          {[24, 25, 30, 60, 120, 240].map((fps) => (
            <TouchableOpacity
              key={fps}
              onPress={() => { setFrameRate(fps); setShowFpsMenu(false); }}
              style={[styles.fpsOption, frameRate === fps && styles.fpsOptionActive]}
            >
              <Text style={[styles.fpsOptionText, frameRate === fps && styles.fpsOptionTextActive]}>
                {fps} fps
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.scrubContainer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
          <Text style={styles.frameText}>Frame {currentFrame}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.scrubTrack} {...scrubPanResponder.panHandlers}>
          <View style={[styles.scrubFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.scrubThumb, { left: `${progress * 100}%` }]} />
        </View>
      </View>

      {poseEnabled && poseProcessing && (
        <View style={styles.poseLoadingIndicator}>
          <Text variant="small" weight="bold" style={{ color: '#00FF88' }}>
            Detecting pose...
          </Text>
        </View>
      )}

      <MediaPipeBridge ref={mediaPipeRef} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  uploadContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoTouchArea: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBtnActive: {
    backgroundColor: 'rgba(255,152,0,0.3)',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  clockOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  clockText: {
    color: '#FF9800',
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  clockModeIndicator: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scrubContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  frameText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scrubTrack: {
    height: 32,
    justifyContent: 'center',
  },
  scrubFill: {
    position: 'absolute',
    left: 0,
    height: 3,
    backgroundColor: '#FF9800',
    borderRadius: 1.5,
  },
  scrubThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    marginLeft: -(THUMB_SIZE / 2),
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  libraryContainer: {
    flex: 1,
  },
  libraryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 16,
  },
  emptyLibrary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  libraryCard: {
    borderRadius: 12,
    padding: 0,
    marginBottom: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  libraryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fpsBtn: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fpsBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  fpsMenu: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
  },
  fpsOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  fpsOptionActive: {
    backgroundColor: 'rgba(255,152,0,0.15)',
  },
  fpsOptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  fpsOptionTextActive: {
    color: '#FF9800',
    fontWeight: '700',
  },
  videoWrapper: {
    flex: 1,
  },
  topBtnPose: {
    backgroundColor: 'rgba(0,255,136,0.2)',
    borderWidth: 1,
    borderColor: '#00FF88',
  },
  poseLoadingIndicator: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
