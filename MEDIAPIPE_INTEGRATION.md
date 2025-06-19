# MediaPipe Video Analysis Integration

## Overview

The video analysis system has been refactored to integrate MediaPipe for biomechanical data extraction with OpenAI for intelligent interpretation. This provides more reliable and detailed athletic performance analysis.

## Architecture

### 1. MediaPipe Processing Layer (`server/video-analysis-mediapipe.py`)
- **Purpose**: Extract pose landmarks and kinematic data from video
- **Technology**: Python + MediaPipe
- **Output**: Structured biomechanical data (JSON)

**Key Metrics Extracted:**
- Stride analysis (rate, count, timing, asymmetry)
- Joint angles (knee, hip, ankle ranges)
- Foot contact events and timing
- Movement pattern consistency

### 2. Integration Service (`server/mediapipe-simple.ts`)
- **Purpose**: Bridge between Python MediaPipe and Node.js backend
- **Functionality**: 
  - Spawns Python processes for video analysis
  - Processes biomechanical data into structured metrics
  - Generates performance scores and insights
  - Handles fallback scenarios

### 3. AI Analysis Layer
- **Purpose**: Interpret biomechanical data with natural language
- **Technology**: OpenAI GPT-4o
- **Input**: Structured metrics instead of raw video
- **Output**: Comprehensive coaching analysis

## API Endpoints

### Enhanced Video Analysis
```
POST /api/video-analysis/:videoId/analyze-enhanced
```

**Request Body:**
```json
{
  "promptId": "sprint_analysis"
}
```

**Response:**
```json
{
  "analysis": "Detailed AI analysis text...",
  "biomechanical_metrics": {
    "stride_rate": 182.5,
    "stride_count": 24,
    "asymmetry": 3.2,
    "knee_angle_range": 45.8,
    "contact_events": 48,
    "analysis_duration": 12.5
  },
  "performance_score": 85,
  "key_insights": [
    "Optimal stride rate of 183 spm",
    "Mild asymmetry present (3.2%)",
    "Healthy knee range of motion"
  ],
  "recommendations": [
    "Monitor asymmetry and consider corrective exercises",
    "Maintain current form with consistent training"
  ],
  "analysis_type": "enhanced_biomechanical"
}
```

## Key Improvements

### 1. Reliability
- MediaPipe provides consistent pose detection
- Fallback metrics ensure analysis always completes
- Structured data reduces AI interpretation errors

### 2. Athletic Focus
- Specific metrics for running/sprinting performance
- Evidence-based performance scoring
- Targeted recommendations for improvement

### 3. User Experience
- Faster analysis with structured data processing
- Consistent formatting and insights
- Performance scores for progress tracking

## Implementation Details

### Biomechanical Metrics

**Stride Analysis:**
- `stride_rate`: Steps per minute
- `stride_count`: Total strides detected
- `asymmetry`: Left/right imbalance percentage

**Joint Analysis:**
- `knee_angle_range`: Average knee flexion range
- `contact_events`: Foot contact instances
- `analysis_duration`: Video length processed

### Performance Scoring Algorithm

Base score: 100 points

**Deductions:**
- Stride rate outside 170-190 spm: -8 to -15 points
- Asymmetry > 3%: -6 to -20 points
- Limited knee range < 30°: -15 points
- Excessive knee flexion > 80°: -10 points

### Fallback Handling

1. **MediaPipe Failure**: Returns default metrics with OpenAI analysis
2. **OpenAI Failure**: Generates rule-based analysis from metrics
3. **Complete Failure**: Provides structured error response

## Usage Instructions

### For Frontend Integration

1. Upload video via existing upload endpoint
2. Call enhanced analysis endpoint with video ID
3. Display structured results with performance metrics
4. Show recommendations and insights prominently

### For Testing

Use the existing video analysis page - the enhanced endpoint provides backward compatibility while adding biomechanical data.

## Dependencies

- **Python 3**: Required for MediaPipe processing
- **MediaPipe**: Pose detection library
- **OpenCV**: Video processing
- **NumPy**: Mathematical operations

## Error Handling

The system includes comprehensive error handling:
- Python process failures are caught and logged
- MediaPipe errors trigger fallback analysis
- Malformed data is replaced with default values
- All failures still provide useful feedback to users

## Future Enhancements

1. **Video Annotation**: Overlay pose landmarks on videos
2. **Trend Analysis**: Track performance metrics over time
3. **Comparative Analysis**: Compare against optimal movement patterns
4. **Real-time Processing**: Live analysis during video recording