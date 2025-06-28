import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/user.dart';
import '../models/meet.dart';
import '../models/video_analysis.dart';
import 'auth_service.dart';

class ApiService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    return await _authService.getAuthHeaders();
  }

  // User endpoints
  Future<User> getUser(int userId) async {
    final response = await http.get(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.usersEndpoint}/$userId'),
      headers: await _getHeaders(),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode == 200) {
      return User.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to get user: ${response.body}');
    }
  }

  Future<User> updateUser(int userId, Map<String, dynamic> updates) async {
    final response = await http.patch(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.usersEndpoint}/$userId'),
      headers: await _getHeaders(),
      body: jsonEncode(updates),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode == 200) {
      return User.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to update user: ${response.body}');
    }
  }

  // Meet endpoints
  Future<List<Meet>> getMeets() async {
    final response = await http.get(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.meetsEndpoint}'),
      headers: await _getHeaders(),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Meet.fromJson(json)).toList();
    } else {
      throw ApiException('Failed to get meets: ${response.body}');
    }
  }

  Future<Meet> createMeet(CreateMeetRequest request) async {
    final response = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.meetsEndpoint}'),
      headers: await _getHeaders(),
      body: jsonEncode(request.toJson()),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode == 201) {
      return Meet.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to create meet: ${response.body}');
    }
  }

  Future<Meet> updateMeet(int meetId, Map<String, dynamic> updates) async {
    final response = await http.patch(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.meetsEndpoint}/$meetId'),
      headers: await _getHeaders(),
      body: jsonEncode(updates),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode == 200) {
      return Meet.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to update meet: ${response.body}');
    }
  }

  Future<void> deleteMeet(int meetId) async {
    final response = await http.delete(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.meetsEndpoint}/$meetId'),
      headers: await _getHeaders(),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode != 200) {
      throw ApiException('Failed to delete meet: ${response.body}');
    }
  }

  // Video Analysis endpoints
  Future<List<VideoAnalysis>> getVideoAnalyses() async {
    final response = await http.get(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.videoAnalysisEndpoint}'),
      headers: await _getHeaders(),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => VideoAnalysis.fromJson(json)).toList();
    } else {
      throw ApiException('Failed to get video analyses: ${response.body}');
    }
  }

  Future<VideoAnalysis> createVideoAnalysis(CreateVideoAnalysisRequest request) async {
    final response = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.videoAnalysisEndpoint}'),
      headers: await _getHeaders(),
      body: jsonEncode(request.toJson()),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode == 201) {
      return VideoAnalysis.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to create video analysis: ${response.body}');
    }
  }

  Future<VideoAnalysis> uploadVideo(int analysisId, File videoFile) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.videoAnalysisEndpoint}/$analysisId/upload'),
    );

    request.headers.addAll(await _getHeaders());
    request.files.add(await http.MultipartFile.fromPath('video', videoFile.path));

    final streamedResponse = await request.send().timeout(ApiConstants.uploadTimeout);
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return VideoAnalysis.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to upload video: ${response.body}');
    }
  }

  Future<VideoAnalysis> getVideoAnalysis(int analysisId) async {
    final response = await http.get(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.videoAnalysisEndpoint}/$analysisId'),
      headers: await _getHeaders(),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode == 200) {
      return VideoAnalysis.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to get video analysis: ${response.body}');
    }
  }

  Future<void> deleteVideoAnalysis(int analysisId) async {
    final response = await http.delete(
      Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.videoAnalysisEndpoint}/$analysisId'),
      headers: await _getHeaders(),
    ).timeout(ApiConstants.requestTimeout);

    if (response.statusCode != 200) {
      throw ApiException('Failed to delete video analysis: ${response.body}');
    }
  }
}

class ApiException implements Exception {
  final String message;
  
  const ApiException(this.message);
  
  @override
  String toString() => 'ApiException: $message';
}