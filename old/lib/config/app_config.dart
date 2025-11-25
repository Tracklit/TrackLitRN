class AppConfig {
  static const String appName = 'TrackLit';
  static const String apiBaseUrl = 'https://your-api-domain.com/api';
  
  // API Endpoints
  static const String authEndpoint = '/auth';
  static const String usersEndpoint = '/users';
  static const String meetsEndpoint = '/meets';
  static const String resultsEndpoint = '/results';
  static const String videoAnalysisEndpoint = '/video-analysis';
  static const String trainingEndpoint = '/training';
  static const String chatEndpoint = '/chat';
  
  // Video Analysis Settings
  static const int maxVideoSizeBytes = 100 * 1024 * 1024; // 100MB
  static const List<String> supportedVideoFormats = ['mp4', 'mov', 'avi'];
  
  // Training Settings
  static const int defaultWarmupTime = 60; // minutes
  static const int defaultArrivalTime = 90; // minutes
  
  // Premium Features
  static const Map<String, List<String>> subscriptionFeatures = {
    'free': ['basic_training', 'meet_tracking'],
    'pro': ['basic_training', 'meet_tracking', 'video_analysis', 'coach_notes'],
    'star': ['basic_training', 'meet_tracking', 'video_analysis', 'coach_notes', 'ai_insights', 'advanced_analytics'],
  };
}

class ApiConstants {
  static const Map<String, String> headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  static const Duration requestTimeout = Duration(seconds: 30);
  static const Duration uploadTimeout = Duration(minutes: 5);
}