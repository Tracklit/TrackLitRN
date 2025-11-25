import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/meet.dart';
import '../services/api_service.dart';

final apiServiceProvider = Provider((ref) => ApiService());

final meetsProvider = StateNotifierProvider<MeetsNotifier, AsyncValue<List<Meet>>>((ref) {
  return MeetsNotifier(ref.read(apiServiceProvider));
});

class MeetsNotifier extends StateNotifier<AsyncValue<List<Meet>>> {
  final ApiService _apiService;

  MeetsNotifier(this._apiService) : super(const AsyncValue.loading()) {
    loadMeets();
  }

  Future<void> loadMeets() async {
    state = const AsyncValue.loading();
    
    try {
      final meets = await _apiService.getMeets();
      state = AsyncValue.data(meets);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<bool> createMeet(CreateMeetRequest request) async {
    try {
      final newMeet = await _apiService.createMeet(request);
      
      state.whenData((meets) {
        state = AsyncValue.data([...meets, newMeet]);
      });
      
      return true;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }

  Future<bool> updateMeet(int meetId, Map<String, dynamic> updates) async {
    try {
      final updatedMeet = await _apiService.updateMeet(meetId, updates);
      
      state.whenData((meets) {
        final updatedMeets = meets.map((meet) {
          return meet.id == meetId ? updatedMeet : meet;
        }).toList();
        state = AsyncValue.data(updatedMeets);
      });
      
      return true;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }

  Future<bool> deleteMeet(int meetId) async {
    try {
      await _apiService.deleteMeet(meetId);
      
      state.whenData((meets) {
        final updatedMeets = meets.where((meet) => meet.id != meetId).toList();
        state = AsyncValue.data(updatedMeets);
      });
      
      return true;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }

  void refresh() {
    loadMeets();
  }
}