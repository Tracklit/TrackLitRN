class VideoAnalysis {
  final int id;
  final int userId;
  final String name;
  final String description;
  final String analysisType;
  final String status;
  final String? videoUrl;
  final String? thumbnailUrl;
  final Map<String, dynamic>? analysisData;
  final String? aiAnalysis;
  final DateTime createdAt;
  final DateTime? completedAt;

  const VideoAnalysis({
    required this.id,
    required this.userId,
    required this.name,
    required this.description,
    required this.analysisType,
    required this.status,
    this.videoUrl,
    this.thumbnailUrl,
    this.analysisData,
    this.aiAnalysis,
    required this.createdAt,
    this.completedAt,
  });

  factory VideoAnalysis.fromJson(Map<String, dynamic> json) {
    return VideoAnalysis(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      name: json['name'] as String,
      description: json['description'] as String,
      analysisType: json['analysis_type'] as String,
      status: json['status'] as String,
      videoUrl: json['video_url'] as String?,
      thumbnailUrl: json['thumbnail_url'] as String?,
      analysisData: json['analysis_data'] as Map<String, dynamic>?,
      aiAnalysis: json['ai_analysis'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      completedAt: json['completed_at'] != null 
          ? DateTime.parse(json['completed_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'description': description,
      'analysis_type': analysisType,
      'status': status,
      'video_url': videoUrl,
      'thumbnail_url': thumbnailUrl,
      'analysis_data': analysisData,
      'ai_analysis': aiAnalysis,
      'created_at': createdAt.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
    };
  }
}

class CreateVideoAnalysisRequest {
  final String name;
  final String description;
  final String analysisType;

  const CreateVideoAnalysisRequest({
    required this.name,
    required this.description,
    required this.analysisType,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'analysis_type': analysisType,
    };
  }
}

class PoseData {
  final List<PoseFrame> frames;
  final int totalFrames;
  final double frameRate;
  final double videoDuration;

  const PoseData({
    required this.frames,
    required this.totalFrames,
    required this.frameRate,
    required this.videoDuration,
  });

  factory PoseData.fromJson(Map<String, dynamic> json) {
    return PoseData(
      frames: (json['frame_data'] as List? ?? [])
          .map((frame) => PoseFrame.fromJson(frame as Map<String, dynamic>))
          .toList(),
      totalFrames: json['total_frames'] as int? ?? 0,
      frameRate: (json['frame_rate'] as num?)?.toDouble() ?? 30.0,
      videoDuration: (json['video_duration'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class PoseFrame {
  final int frameNumber;
  final double timestamp;
  final List<PoseLandmark> landmarks;

  const PoseFrame({
    required this.frameNumber,
    required this.timestamp,
    required this.landmarks,
  });

  factory PoseFrame.fromJson(Map<String, dynamic> json) {
    return PoseFrame(
      frameNumber: json['frame_number'] as int,
      timestamp: (json['timestamp'] as num).toDouble(),
      landmarks: (json['landmarks'] as List? ?? [])
          .map((landmark) => PoseLandmark.fromJson(landmark as Map<String, dynamic>))
          .toList(),
    );
  }
}

class PoseLandmark {
  final String name;
  final double x;
  final double y;
  final double z;
  final double visibility;

  const PoseLandmark({
    required this.name,
    required this.x,
    required this.y,
    required this.z,
    required this.visibility,
  });

  factory PoseLandmark.fromJson(Map<String, dynamic> json) {
    return PoseLandmark(
      name: json['name'] as String,
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
      z: (json['z'] as num).toDouble(),
      visibility: (json['visibility'] as num).toDouble(),
    );
  }
}