#!/usr/bin/env python3
"""
Real-time MediaPipe pose tracking for video analysis
Streams pose landmarks and biomechanical data frame by frame
"""

import sys
import json
import cv2
import numpy as np
import math
import time
from typing import Dict, List, Tuple, Optional

try:
    import mediapipe as mp
except ImportError:
    print(json.dumps({"error": "MediaPipe not installed"}))
    sys.exit(1)

class RealtimePoseTracker:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Track previous frame data for velocity calculations
        self.prev_landmarks = None
        self.prev_timestamp = None
        self.frame_count = 0
        self.fps = 30  # Default FPS
        
    def calculate_angle(self, p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]) -> float:
        """Calculate angle between three points"""
        try:
            v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
            v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
            
            cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
            angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
            return np.degrees(angle)
        except:
            return 0.0
    
    def extract_landmarks(self, landmarks, frame_width: int, frame_height: int) -> Dict:
        """Extract key landmarks with pixel coordinates"""
        if not landmarks:
            return {}
        
        key_points = {}
        landmark_map = {
            'nose': mp.solutions.pose.PoseLandmark.NOSE,
            'left_shoulder': mp.solutions.pose.PoseLandmark.LEFT_SHOULDER,
            'right_shoulder': mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER,
            'left_elbow': mp.solutions.pose.PoseLandmark.LEFT_ELBOW,
            'right_elbow': mp.solutions.pose.PoseLandmark.RIGHT_ELBOW,
            'left_wrist': mp.solutions.pose.PoseLandmark.LEFT_WRIST,
            'right_wrist': mp.solutions.pose.PoseLandmark.RIGHT_WRIST,
            'left_hip': mp.solutions.pose.PoseLandmark.LEFT_HIP,
            'right_hip': mp.solutions.pose.PoseLandmark.RIGHT_HIP,
            'left_knee': mp.solutions.pose.PoseLandmark.LEFT_KNEE,
            'right_knee': mp.solutions.pose.PoseLandmark.RIGHT_KNEE,
            'left_ankle': mp.solutions.pose.PoseLandmark.LEFT_ANKLE,
            'right_ankle': mp.solutions.pose.PoseLandmark.RIGHT_ANKLE,
            'left_foot_index': mp.solutions.pose.PoseLandmark.LEFT_FOOT_INDEX,
            'right_foot_index': mp.solutions.pose.PoseLandmark.RIGHT_FOOT_INDEX
        }
        
        for name, landmark_id in landmark_map.items():
            landmark = landmarks.landmark[landmark_id]
            if landmark.visibility > 0.5:  # Only use visible landmarks
                key_points[name] = {
                    'x': int(landmark.x * frame_width),
                    'y': int(landmark.y * frame_height),
                    'z': landmark.z,
                    'visibility': landmark.visibility,
                    'normalized_x': landmark.x,
                    'normalized_y': landmark.y
                }
        
        return key_points
    
    def calculate_joint_angles(self, landmarks: Dict) -> Dict:
        """Calculate joint angles from landmarks"""
        angles = {}
        
        try:
            # Left knee angle
            if all(k in landmarks for k in ['left_hip', 'left_knee', 'left_ankle']):
                hip = (landmarks['left_hip']['x'], landmarks['left_hip']['y'])
                knee = (landmarks['left_knee']['x'], landmarks['left_knee']['y'])
                ankle = (landmarks['left_ankle']['x'], landmarks['left_ankle']['y'])
                angles['left_knee'] = self.calculate_angle(hip, knee, ankle)
            
            # Right knee angle
            if all(k in landmarks for k in ['right_hip', 'right_knee', 'right_ankle']):
                hip = (landmarks['right_hip']['x'], landmarks['right_hip']['y'])
                knee = (landmarks['right_knee']['x'], landmarks['right_knee']['y'])
                ankle = (landmarks['right_ankle']['x'], landmarks['right_ankle']['y'])
                angles['right_knee'] = self.calculate_angle(hip, knee, ankle)
            
            # Hip angles
            if all(k in landmarks for k in ['left_shoulder', 'left_hip', 'left_knee']):
                shoulder = (landmarks['left_shoulder']['x'], landmarks['left_shoulder']['y'])
                hip = (landmarks['left_hip']['x'], landmarks['left_hip']['y'])
                knee = (landmarks['left_knee']['x'], landmarks['left_knee']['y'])
                angles['left_hip'] = self.calculate_angle(shoulder, hip, knee)
            
            if all(k in landmarks for k in ['right_shoulder', 'right_hip', 'right_knee']):
                shoulder = (landmarks['right_shoulder']['x'], landmarks['right_shoulder']['y'])
                hip = (landmarks['right_hip']['x'], landmarks['right_hip']['y'])
                knee = (landmarks['right_knee']['x'], landmarks['right_knee']['y'])
                angles['right_hip'] = self.calculate_angle(shoulder, hip, knee)
                
            # Trunk angle (shoulder to hip vertical alignment)
            if all(k in landmarks for k in ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip']):
                left_shoulder = landmarks['left_shoulder']
                right_shoulder = landmarks['right_shoulder']
                left_hip = landmarks['left_hip']
                right_hip = landmarks['right_hip']
                
                shoulder_mid = ((left_shoulder['x'] + right_shoulder['x']) / 2, 
                               (left_shoulder['y'] + right_shoulder['y']) / 2)
                hip_mid = ((left_hip['x'] + right_hip['x']) / 2, 
                          (left_hip['y'] + right_hip['y']) / 2)
                
                # Calculate angle from vertical
                trunk_vector = (hip_mid[0] - shoulder_mid[0], hip_mid[1] - shoulder_mid[1])
                vertical_vector = (0, 1)
                
                dot_product = trunk_vector[1]
                magnitude = math.sqrt(trunk_vector[0]**2 + trunk_vector[1]**2)
                if magnitude > 0:
                    angles['trunk'] = math.degrees(math.acos(abs(dot_product) / magnitude))
        
        except Exception as e:
            angles['error'] = str(e)
        
        return angles
    
    def calculate_velocities(self, current_landmarks: Dict, frame_time: float) -> Dict:
        """Calculate velocity vectors between frames"""
        velocities = {}
        
        if self.prev_landmarks is None or self.prev_timestamp is None:
            return velocities
        
        dt = frame_time - self.prev_timestamp
        if dt <= 0:
            return velocities
        
        for landmark_name in current_landmarks:
            if landmark_name in self.prev_landmarks:
                curr = current_landmarks[landmark_name]
                prev = self.prev_landmarks[landmark_name]
                
                dx = curr['x'] - prev['x']
                dy = curr['y'] - prev['y']
                
                velocities[landmark_name] = {
                    'vx': dx / dt,
                    'vy': dy / dt,
                    'speed': math.sqrt((dx/dt)**2 + (dy/dt)**2)
                }
        
        return velocities
    
    def detect_ground_contact(self, landmarks: Dict, velocities: Dict) -> Dict:
        """Detect ground contact based on foot position and velocity"""
        contact_data = {}
        
        for side in ['left', 'right']:
            ankle_key = f'{side}_ankle'
            foot_key = f'{side}_foot_index'
            
            if ankle_key in landmarks and ankle_key in velocities:
                ankle_pos = landmarks[ankle_key]
                ankle_vel = velocities[ankle_key]
                
                # Simple ground contact detection
                is_contact = ankle_vel['speed'] < 50  # Low velocity threshold
                contact_data[f'{side}_foot_contact'] = {
                    'is_contact': is_contact,
                    'ankle_height': ankle_pos['y'],
                    'velocity': ankle_vel['speed']
                }
        
        return contact_data
    
    def calculate_stride_metrics(self, landmarks: Dict, velocities: Dict) -> Dict:
        """Calculate stride-related metrics"""
        stride_data = {}
        
        if 'left_ankle' in landmarks and 'right_ankle' in landmarks:
            left_ankle = landmarks['left_ankle']
            right_ankle = landmarks['right_ankle']
            
            # Stride width (lateral distance between feet)
            stride_width = abs(left_ankle['x'] - right_ankle['x'])
            
            # Step length estimation (distance between feet)
            step_length = math.sqrt((left_ankle['x'] - right_ankle['x'])**2 + 
                                   (left_ankle['y'] - right_ankle['y'])**2)
            
            stride_data = {
                'stride_width': stride_width,
                'step_length': step_length,
                'frame_number': self.frame_count
            }
        
        return stride_data
    
    def process_video(self, video_path: str):
        """Process video and stream pose data"""
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            print(json.dumps({"error": f"Could not open video: {video_path}"}))
            return
        
        # Get video properties
        self.fps = cap.get(cv2.CAP_PROP_FPS) or 30
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(json.dumps({
            "type": "video_info",
            "fps": self.fps,
            "width": frame_width,
            "height": frame_height
        }))
        sys.stdout.flush()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            self.frame_count += 1
            frame_time = self.frame_count / self.fps
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process pose
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                # Extract landmarks
                landmarks = self.extract_landmarks(
                    results.pose_landmarks, frame_width, frame_height
                )
                
                # Calculate joint angles
                angles = self.calculate_joint_angles(landmarks)
                
                # Calculate velocities
                velocities = self.calculate_velocities(landmarks, frame_time)
                
                # Detect ground contact
                contact_data = self.detect_ground_contact(landmarks, velocities)
                
                # Calculate stride metrics
                stride_data = self.calculate_stride_metrics(landmarks, velocities)
                
                # Prepare frame data
                frame_data = {
                    "type": "pose_frame",
                    "frame": self.frame_count,
                    "timestamp": frame_time,
                    "landmarks": landmarks,
                    "angles": angles,
                    "velocities": velocities,
                    "ground_contact": contact_data,
                    "stride_metrics": stride_data,
                    "frame_dimensions": {
                        "width": frame_width,
                        "height": frame_height
                    }
                }
                
                print(json.dumps(frame_data))
                sys.stdout.flush()
                
                # Update previous frame data
                self.prev_landmarks = landmarks
                self.prev_timestamp = frame_time
            
            # Small delay to prevent overwhelming the client
            time.sleep(0.033)  # ~30 FPS
        
        cap.release()
        print(json.dumps({"type": "video_complete"}))

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python realtime-mediapipe.py <video_path>"}))
        sys.exit(1)
    
    video_path = sys.argv[1]
    tracker = RealtimePoseTracker()
    tracker.process_video(video_path)

if __name__ == "__main__":
    main()