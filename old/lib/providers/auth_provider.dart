import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

final authServiceProvider = Provider((ref) => AuthService());

final currentUserProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  return AuthNotifier(ref.read(authServiceProvider));
});

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AsyncValue.loading()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    try {
      final user = await _authService.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<bool> login(String username, String password) async {
    state = const AsyncValue.loading();
    
    try {
      final request = LoginRequest(username: username, password: password);
      final user = await _authService.login(request);
      
      if (user != null) {
        state = AsyncValue.data(user);
        return true;
      } else {
        state = const AsyncValue.data(null);
        return false;
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }

  Future<bool> register(String username, String password, String name, String email, bool isCoach) async {
    state = const AsyncValue.loading();
    
    try {
      final request = RegisterRequest(
        username: username,
        password: password,
        name: name,
        email: email,
        isCoach: isCoach,
      );
      final user = await _authService.register(request);
      
      if (user != null) {
        state = AsyncValue.data(user);
        return true;
      } else {
        state = const AsyncValue.data(null);
        return false;
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _authService.logout();
      state = const AsyncValue.data(null);
    } catch (e) {
      // Force logout locally even if server call fails
      state = const AsyncValue.data(null);
    }
  }

  void updateUser(User user) {
    state = AsyncValue.data(user);
  }
}