#!/usr/bin/env python3
"""
Simplified MediaPipe pose analysis for athletic performance
Optimized for fast processing with authentic pose data
"""

import sys
import json
import cv2
import numpy as np
import mediapipe as mp

def analyze_video_pose(video_path):
    """Analyze video with MediaPipe pose detection - simplified version"""
    try:
        # Initialize MediaPipe Pose
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=0,  # Lightest model for speed
            enable_segmentation=False,
            min_detection_confidence=0.3,
            min_tracking_confidence=0.2
        )
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": f"Cannot open video: {video_path}"}
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS) or 24
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        # Process limited frames for performance
        max_frames = min(60, total_frames)  # Process max 60 frames (2 seconds at 30fps)
        frame_skip = max(1, total_frames // max_frames)
        
        frame_data = []
        frame_count = 0
        processed = 0
        
        print(f"Processing {max_frames} frames from {total_frames} total", file=sys.stderr)
        
        while processed < max_frames and cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Skip frames for performance
            if frame_count % frame_skip != 0:
                frame_count += 1
                continue
            
            # Resize for faster processing
            height, width = frame.shape[:2]
            if width > 480:
                scale = 480 / width
                new_width = 480
                new_height = int(height * scale)
                frame = cv2.resize(frame, (new_width, new_height))
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = pose.process(rgb_frame)
            
            timestamp = frame_count / fps
            pose_landmarks = []
            
            if results.pose_landmarks:
                # Extract pose landmarks
                for landmark in results.pose_landmarks.landmark:
                    pose_landmarks.append({
                        'x': float(landmark.x),
                        'y': float(landmark.y),
                        'z': float(landmark.z),
                        'visibility': float(landmark.visibility)
                    })
            
            frame_data.append({
                'frame': frame_count,
                'timestamp': timestamp,
                'pose_landmarks': pose_landmarks
            })
            
            frame_count += 1
            processed += 1
        
        cap.release()
        pose.close()
        
        if not frame_data:
            return {"error": "No frames processed"}
        
        # Count frames with valid pose data
        valid_frames = len([f for f in frame_data if len(f['pose_landmarks']) > 0])
        
        result = {
            "fps": fps,
            "total_frames": total_frames,
            "duration": duration,
            "processed_frames": len(frame_data),
            "valid_pose_frames": valid_frames,
            "frame_data": frame_data
        }
        
        print(f"Analysis complete: {valid_frames}/{len(frame_data)} frames with pose data", file=sys.stderr)
        return result
        
    except Exception as e:
        return {"error": f"MediaPipe analysis failed: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python3 video-analysis-simple.py <video_path>"}))
        sys.exit(1)
    
    video_path = sys.argv[1]
    result = analyze_video_pose(video_path)
    print(json.dumps(result))