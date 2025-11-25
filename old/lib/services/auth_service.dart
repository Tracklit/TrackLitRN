import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/user.dart';

class AuthService {
  static const String _sessionTokenKey = 'session_token';
  static const String _userKey = 'user_data';

  Future<User?> login(LoginRequest request) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.authEndpoint}/login'),
        headers: ApiConstants.headers,
        body: jsonEncode(request.toJson()),
      ).timeout(ApiConstants.requestTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = User.fromJson(data['user']);
        
        // Store session token and user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_sessionTokenKey, data['sessionToken']);
        await prefs.setString(_userKey, jsonEncode(user.toJson()));
        
        return user;
      } else {
        throw AuthException('Login failed: ${response.body}');
      }
    } catch (e) {
      throw AuthException('Network error: ${e.toString()}');
    }
  }

  Future<User?> register(RegisterRequest request) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.authEndpoint}/register'),
        headers: ApiConstants.headers,
        body: jsonEncode(request.toJson()),
      ).timeout(ApiConstants.requestTimeout);

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final user = User.fromJson(data['user']);
        
        // Store session token and user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_sessionTokenKey, data['sessionToken']);
        await prefs.setString(_userKey, jsonEncode(user.toJson()));
        
        return user;
      } else {
        throw AuthException('Registration failed: ${response.body}');
      }
    } catch (e) {
      throw AuthException('Network error: ${e.toString()}');
    }
  }

  Future<void> logout() async {
    try {
      final sessionToken = await getSessionToken();
      if (sessionToken != null) {
        await http.post(
          Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.authEndpoint}/logout'),
          headers: {
            ...ApiConstants.headers,
            'Authorization': 'Bearer $sessionToken',
          },
        ).timeout(ApiConstants.requestTimeout);
      }
    } catch (e) {
      // Continue with local logout even if server request fails
    }

    // Clear local storage
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionTokenKey);
    await prefs.remove(_userKey);
  }

  Future<User?> getCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(_userKey);
      
      if (userJson != null) {
        return User.fromJson(jsonDecode(userJson));
      }
    } catch (e) {
      // Clear corrupted data
      await logout();
    }
    
    return null;
  }

  Future<String?> getSessionToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_sessionTokenKey);
  }

  Future<bool> isLoggedIn() async {
    final user = await getCurrentUser();
    final token = await getSessionToken();
    return user != null && token != null;
  }

  Future<Map<String, String>> getAuthHeaders() async {
    final token = await getSessionToken();
    return {
      ...ApiConstants.headers,
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}

class AuthException implements Exception {
  final String message;
  
  const AuthException(this.message);
  
  @override
  String toString() => 'AuthException: $message';
}