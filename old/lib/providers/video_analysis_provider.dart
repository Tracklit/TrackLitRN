import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/video_analysis.dart';
import '../services/api_service.dart';

final videoAnalysisProvider = StateNotifierProvider<VideoAnalysisNotifier, AsyncValue<List<VideoAnalysis>>>((ref) {
  return VideoAnalysisNotifier(ref.read(apiServiceProvider));
});

class VideoAnalysisNotifier extends StateNotifier<AsyncValue<List<VideoAnalysis>>> {
  final ApiService _apiService;

  VideoAnalysisNotifier(this._apiService) : super(const AsyncValue.loading()) {
    loadVideoAnalyses();
  }

  Future<void> loadVideoAnalyses() async {
    state = const AsyncValue.loading();
    
    try {
      final analyses = await _apiService.getVideoAnalyses();
      state = AsyncValue.data(analyses);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<VideoAnalysis?> createVideoAnalysis(CreateVideoAnalysisRequest request) async {
    try {
      final newAnalysis = await _apiService.createVideoAnalysis(request);
      
      state.whenData((analyses) {
        state = AsyncValue.data([newAnalysis, ...analyses]);
      });
      
      return newAnalysis;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return null;
    }
  }

  Future<bool> uploadVideo(int analysisId, File videoFile) async {
    try {
      final updatedAnalysis = await _apiService.uploadVideo(analysisId, videoFile);
      
      state.whenData((analyses) {
        final updatedAnalyses = analyses.map((analysis) {
          return analysis.id == analysisId ? updatedAnalysis : analysis;
        }).toList();
        state = AsyncValue.data(updatedAnalyses);
      });
      
      return true;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }

  Future<VideoAnalysis?> getVideoAnalysis(int analysisId) async {
    try {
      final analysis = await _apiService.getVideoAnalysis(analysisId);
      
      // Update the analysis in the list
      state.whenData((analyses) {
        final updatedAnalyses = analyses.map((a) {
          return a.id == analysisId ? analysis : a;
        }).toList();
        state = AsyncValue.data(updatedAnalyses);
      });
      
      return analysis;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return null;
    }
  }

  Future<bool> deleteVideoAnalysis(int analysisId) async {
    try {
      await _apiService.deleteVideoAnalysis(analysisId);
      
      state.whenData((analyses) {
        final updatedAnalyses = analyses.where((analysis) => analysis.id != analysisId).toList();
        state = AsyncValue.data(updatedAnalyses);
      });
      
      return true;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }

  void refresh() {
    loadVideoAnalyses();
  }
}