#!/usr/bin/env python3
"""
MediaPipe-based biomechanical analysis for athletic performance
Extracts pose landmarks, kinematic data, and motion metrics from video
"""

import sys
import json
import cv2
import numpy as np
import math
from typing import Dict, List, Tuple, Optional
import argparse

try:
    import mediapipe as mp
except ImportError:
    print(json.dumps({"error": "MediaPipe not installed. Please install: pip install mediapipe"}))
    sys.exit(1)

class BiomechanicalAnalyzer:
    def __init__(self):
        """Initialize MediaPipe pose detection"""
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_draw = mp.solutions.drawing_utils
        
        # Athletic performance metrics
        self.frame_data = []
        self.stride_events = []
        self.joint_angles = []
        
    def calculate_angle(self, p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]) -> float:
        """Calculate angle between three points"""
        v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
        v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
        angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
        return np.degrees(angle)
    
    def extract_key_points(self, landmarks) -> Dict:
        """Extract key body landmarks for athletic analysis"""
        if not landmarks:
            return {}
            
        key_points = {}
        
        # Define key landmarks for running analysis
        landmark_indices = {
            'nose': 0,
            'left_shoulder': 11,
            'right_shoulder': 12,
            'left_elbow': 13,
            'right_elbow': 14,
            'left_wrist': 15,
            'right_wrist': 16,
            'left_hip': 23,
            'right_hip': 24,
            'left_knee': 25,
            'right_knee': 26,
            'left_ankle': 27,
            'right_ankle': 28,
            'left_heel': 29,
            'right_heel': 30,
            'left_foot_index': 31,
            'right_foot_index': 32
        }
        
        for name, idx in landmark_indices.items():
            if idx < len(landmarks.landmark):
                landmark = landmarks.landmark[idx]
                key_points[name] = {
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility
                }
        
        return key_points
    
    def calculate_joint_angles(self, key_points: Dict, frame_idx: int) -> Dict:
        """Calculate key joint angles for biomechanical analysis"""
        angles = {'frame': frame_idx}
        
        try:
            # Left knee angle (hip-knee-ankle)
            if all(k in key_points for k in ['left_hip', 'left_knee', 'left_ankle']):
                hip = (key_points['left_hip']['x'], key_points['left_hip']['y'])
                knee = (key_points['left_knee']['x'], key_points['left_knee']['y'])
                ankle = (key_points['left_ankle']['x'], key_points['left_ankle']['y'])
                angles['left_knee'] = self.calculate_angle(hip, knee, ankle)
            
            # Right knee angle
            if all(k in key_points for k in ['right_hip', 'right_knee', 'right_ankle']):
                hip = (key_points['right_hip']['x'], key_points['right_hip']['y'])
                knee = (key_points['right_knee']['x'], key_points['right_knee']['y'])
                ankle = (key_points['right_ankle']['x'], key_points['right_ankle']['y'])
                angles['right_knee'] = self.calculate_angle(hip, knee, ankle)
            
            # Left hip angle (shoulder-hip-knee)
            if all(k in key_points for k in ['left_shoulder', 'left_hip', 'left_knee']):
                shoulder = (key_points['left_shoulder']['x'], key_points['left_shoulder']['y'])
                hip = (key_points['left_hip']['x'], key_points['left_hip']['y'])
                knee = (key_points['left_knee']['x'], key_points['left_knee']['y'])
                angles['left_hip'] = self.calculate_angle(shoulder, hip, knee)
            
            # Right hip angle
            if all(k in key_points for k in ['right_shoulder', 'right_hip', 'right_knee']):
                shoulder = (key_points['right_shoulder']['x'], key_points['right_shoulder']['y'])
                hip = (key_points['right_hip']['x'], key_points['right_hip']['y'])
                knee = (key_points['right_knee']['x'], key_points['right_knee']['y'])
                angles['right_hip'] = self.calculate_angle(shoulder, hip, knee)
                
            # Left ankle angle (knee-ankle-foot)
            if all(k in key_points for k in ['left_knee', 'left_ankle', 'left_foot_index']):
                knee = (key_points['left_knee']['x'], key_points['left_knee']['y'])
                ankle = (key_points['left_ankle']['x'], key_points['left_ankle']['y'])
                foot = (key_points['left_foot_index']['x'], key_points['left_foot_index']['y'])
                angles['left_ankle'] = self.calculate_angle(knee, ankle, foot)
                
            # Right ankle angle
            if all(k in key_points for k in ['right_knee', 'right_ankle', 'right_foot_index']):
                knee = (key_points['right_knee']['x'], key_points['right_knee']['y'])
                ankle = (key_points['right_ankle']['x'], key_points['right_ankle']['y'])
                foot = (key_points['right_foot_index']['x'], key_points['right_foot_index']['y'])
                angles['right_ankle'] = self.calculate_angle(knee, ankle, foot)
        
        except Exception as e:
            angles['error'] = str(e)
        
        return angles
    
    def detect_foot_contacts(self, frame_data: List[Dict]) -> List[Dict]:
        """Detect foot contact events from pose data"""
        contact_events = []
        
        if len(frame_data) < 2:
            return contact_events
        
        for i in range(1, len(frame_data)):
            prev_frame = frame_data[i-1]
            curr_frame = frame_data[i]
            
            # Check for foot contact based on vertical velocity and position
            for side in ['left', 'right']:
                ankle_key = f'{side}_ankle'
                
                if ankle_key in prev_frame['key_points'] and ankle_key in curr_frame['key_points']:
                    prev_y = prev_frame['key_points'][ankle_key]['y']
                    curr_y = curr_frame['key_points'][ankle_key]['y']
                    
                    # Simple foot contact detection based on minimal vertical movement
                    velocity = abs(curr_y - prev_y)
                    
                    if velocity < 0.01:  # Threshold for contact detection
                        contact_events.append({
                            'frame': curr_frame['frame'],
                            'timestamp': curr_frame['timestamp'],
                            'foot': side,
                            'type': 'contact',
                            'ankle_position': curr_frame['key_points'][ankle_key]
                        })
        
        return contact_events
    
    def calculate_stride_metrics(self, contact_events: List[Dict]) -> Dict:
        """Calculate stride-related metrics"""
        if len(contact_events) < 4:
            return {
                'stride_count': 0,
                'average_stride_time': 0,
                'stride_rate': 0,
                'asymmetry': 0
            }
        
        # Group contacts by foot
        left_contacts = [e for e in contact_events if e['foot'] == 'left']
        right_contacts = [e for e in contact_events if e['foot'] == 'right']
        
        # Calculate stride times
        left_stride_times = []
        right_stride_times = []
        
        for i in range(1, len(left_contacts)):
            stride_time = left_contacts[i]['timestamp'] - left_contacts[i-1]['timestamp']
            left_stride_times.append(stride_time)
        
        for i in range(1, len(right_contacts)):
            stride_time = right_contacts[i]['timestamp'] - right_contacts[i-1]['timestamp']
            right_stride_times.append(stride_time)
        
        all_stride_times = left_stride_times + right_stride_times
        
        if not all_stride_times:
            return {
                'stride_count': len(contact_events) // 2,
                'average_stride_time': 0,
                'stride_rate': 0,
                'asymmetry': 0
            }
        
        avg_stride_time = np.mean(all_stride_times)
        stride_rate = 60 / avg_stride_time if avg_stride_time > 0 else 0  # steps per minute
        
        # Calculate asymmetry
        if left_stride_times and right_stride_times:
            left_avg = np.mean(left_stride_times)
            right_avg = np.mean(right_stride_times)
            asymmetry = abs(left_avg - right_avg) / max(left_avg, right_avg) * 100
        else:
            asymmetry = 0
        
        return {
            'stride_count': len(contact_events) // 2,
            'average_stride_time': float(avg_stride_time),
            'stride_rate': float(stride_rate),
            'asymmetry': float(asymmetry)
        }
    
    def analyze_video(self, video_path: str) -> Dict:
        """Main video analysis function"""
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            return {"error": f"Could not open video file: {video_path}"}
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        frame_idx = 0
        frame_data = []
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.pose.process(rgb_frame)
            
            timestamp = frame_idx / fps
            
            if results.pose_landmarks:
                key_points = self.extract_key_points(results.pose_landmarks)
                joint_angles = self.calculate_joint_angles(key_points, frame_idx)
                
                # Extract raw pose landmarks for skeleton overlay
                pose_landmarks = []
                for landmark in results.pose_landmarks.landmark:
                    pose_landmarks.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z,
                        'visibility': landmark.visibility
                    })
                
                frame_data.append({
                    'frame': frame_idx,
                    'timestamp': timestamp,
                    'pose_landmarks': pose_landmarks,
                    'key_points': key_points,
                    'joint_angles': joint_angles
                })
            
            frame_idx += 1
        
        cap.release()
        
        if not frame_data:
            return {"error": "No pose data detected in video"}
        
        # Analyze movement patterns
        contact_events = self.detect_foot_contacts(frame_data)
        stride_metrics = self.calculate_stride_metrics(contact_events)
        
        # Calculate joint angle statistics
        angle_stats = self.calculate_angle_statistics(frame_data)
        
        return {
            "fps": fps,
            "total_frames": total_frames,
            "duration": duration,
            "frame_data": frame_data,
            "stride_analysis": stride_metrics,
            "joint_angles": angle_stats,
            "contact_events": contact_events[:10],
            "video_info": {
                "duration": duration,
                "total_frames": total_frames,
                "fps": fps,
                "analyzed_frames": len(frame_data)
            }
        }
    
    def calculate_angle_statistics(self, frame_data: List[Dict]) -> Dict:
        """Calculate statistics for joint angles throughout the movement"""
        angle_stats = {}
        
        # Collect all angle measurements
        angle_collections = {
            'left_knee': [],
            'right_knee': [],
            'left_hip': [],
            'right_hip': [],
            'left_ankle': [],
            'right_ankle': []
        }
        
        for frame in frame_data:
            if 'joint_angles' in frame:
                for angle_name in angle_collections.keys():
                    if angle_name in frame['joint_angles']:
                        angle_collections[angle_name].append(frame['joint_angles'][angle_name])
        
        # Calculate statistics for each angle
        for angle_name, angles in angle_collections.items():
            if angles:
                angle_stats[angle_name] = {
                    'min': float(np.min(angles)),
                    'max': float(np.max(angles)),
                    'mean': float(np.mean(angles)),
                    'std': float(np.std(angles)),
                    'range': float(np.max(angles) - np.min(angles))
                }
        
        return angle_stats

def main():
    parser = argparse.ArgumentParser(description='Analyze video for biomechanical data')
    parser.add_argument('video_path', help='Path to video file')
    parser.add_argument('--output', '-o', help='Output JSON file path')
    
    args = parser.parse_args()
    
    analyzer = BiomechanicalAnalyzer()
    results = analyzer.analyze_video(args.video_path)
    
    output_json = json.dumps(results, indent=2)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output_json)
    else:
        print(output_json)

if __name__ == "__main__":
    main()