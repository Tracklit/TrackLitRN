#!/usr/bin/env python3

import sys
import json
import cv2
import numpy as np
import mediapipe as mp

def test_mediapipe_simple():
    """Test MediaPipe with a simple synthetic frame"""
    try:
        # Create a simple test frame
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.rectangle(frame, (200, 100), (400, 400), (255, 255, 255), -1)  # Simple white rectangle
        
        # Initialize MediaPipe
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5
        )
        
        # Process frame
        results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        if results.pose_landmarks:
            landmarks = []
            for landmark in results.pose_landmarks.landmark:
                landmarks.append({
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z,
                    "visibility": landmark.visibility
                })
            
            test_data = {
                "fps": 24,
                "total_frames": 1,
                "duration": 0.04,
                "frame_data": [{
                    "frame": 0,
                    "timestamp": 0,
                    "pose_landmarks": landmarks
                }]
            }
            
            print(json.dumps(test_data))
        else:
            error_data = {
                "error": "No pose detected in test frame",
                "fps": 24,
                "total_frames": 0,
                "frame_data": []
            }
            print(json.dumps(error_data))
            
        pose.close()
        
    except Exception as e:
        error_data = {
            "error": f"MediaPipe test failed: {str(e)}",
            "fps": 24,
            "total_frames": 0,
            "frame_data": []
        }
        print(json.dumps(error_data))

if __name__ == "__main__":
    test_mediapipe_simple()