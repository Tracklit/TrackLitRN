import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface MediaPipeBridgeRef {
  detectPose: (base64Image: string) => Promise<PoseLandmark[] | null>;
}

const MEDIAPIPE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="module">
    import { PoseLandmarker, FilesetResolver, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

    let poseLandmarker = null;
    let ready = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'IMAGE',
          numPoses: 4
        });
        ready = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
      }
    }

    window.processImage = async function(base64Data, requestId) {
      if (!ready || !poseLandmarker) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          requestId,
          landmarks: null,
          error: 'Not ready'
        }));
        return;
      }

      try {
        const img = new Image();
        img.src = 'data:image/jpeg;base64,' + base64Data;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const result = poseLandmarker.detect(canvas);

        const allLandmarks = result.landmarks.map(poseLandmarks =>
          poseLandmarks.map(lm => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility
          }))
        );

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          requestId,
          landmarks: allLandmarks
        }));
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          requestId,
          landmarks: null,
          error: err.message
        }));
      }
    };

    init();
  </script>
</head>
<body style="margin:0;padding:0;background:#000;"></body>
</html>
`;

export const MediaPipeBridge = forwardRef<MediaPipeBridgeRef>((_, ref) => {
  const webViewRef = useRef<WebView>(null);
  const pendingRequests = useRef<Map<string, { resolve: (v: PoseLandmark[][] | null) => void }>>(new Map());
  const isReady = useRef(false);
  const requestCounter = useRef(0);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'ready') {
        isReady.current = true;
        return;
      }

      if (data.type === 'result') {
        const pending = pendingRequests.current.get(data.requestId);
        if (pending) {
          pending.resolve(data.landmarks || null);
          pendingRequests.current.delete(data.requestId);
        }
        return;
      }
    } catch {}
  }, []);

  useImperativeHandle(ref, () => ({
    detectPose: (base64Image: string): Promise<PoseLandmark[] | null> => {
      return new Promise((resolve) => {
        if (!isReady.current || !webViewRef.current) {
          resolve(null);
          return;
        }

        const requestId = `req_${++requestCounter.current}`;
        pendingRequests.current.set(requestId, {
          resolve: (allLandmarks) => {
            if (allLandmarks && allLandmarks.length > 0) {
              resolve(allLandmarks[0]);
            } else {
              resolve(null);
            }
          }
        });

        const chunkSize = 50000;
        const chunks = [];
        for (let i = 0; i < base64Image.length; i += chunkSize) {
          chunks.push(base64Image.substring(i, i + chunkSize));
        }

        if (chunks.length <= 1) {
          webViewRef.current.injectJavaScript(
            `window.processImage('${base64Image}', '${requestId}'); true;`
          );
        } else {
          let js = `(function(){var d='';`;
          for (const chunk of chunks) {
            js += `d+='${chunk}';`;
          }
          js += `window.processImage(d,'${requestId}');})(); true;`;
          webViewRef.current.injectJavaScript(js);
        }

        setTimeout(() => {
          if (pendingRequests.current.has(requestId)) {
            pendingRequests.current.delete(requestId);
            resolve(null);
          }
        }, 15000);
      });
    },
  }));

  return (
    <View style={styles.hidden}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: MEDIAPIPE_HTML }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        mixedContentMode="always"
        style={styles.webview}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    overflow: 'hidden',
    position: 'absolute',
  },
  webview: {
    width: 1,
    height: 1,
  },
});
