import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'config/app_config.dart';
import 'config/theme.dart';
import 'services/auth_service.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/training/training_screen.dart';
import 'screens/video/video_analysis_screen.dart';
import 'screens/meets/meets_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/chat/chat_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: TrackLitApp(),
    ),
  );
}

class TrackLitApp extends ConsumerWidget {
  const TrackLitApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'TrackLit',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/auth',
  routes: [
    GoRoute(
      path: '/auth',
      builder: (context, state) => const AuthScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/training',
          builder: (context, state) => const TrainingScreen(),
        ),
        GoRoute(
          path: '/video-analysis',
          builder: (context, state) => const VideoAnalysisScreen(),
        ),
        GoRoute(
          path: '/meets',
          builder: (context, state) => const MeetsScreen(),
        ),
        GoRoute(
          path: '/chat',
          builder: (context, state) => const ChatScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),
  ],
  redirect: (context, state) {
    // Add authentication logic here
    return null;
  },
);

class MainShell extends StatefulWidget {
  final Widget child;
  
  const MainShell({required this.child, super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final List<NavigationDestination> _destinations = [
    const NavigationDestination(
      icon: Icon(Icons.home_outlined),
      selectedIcon: Icon(Icons.home),
      label: 'Home',
    ),
    const NavigationDestination(
      icon: Icon(Icons.fitness_center_outlined),
      selectedIcon: Icon(Icons.fitness_center),
      label: 'Training',
    ),
    const NavigationDestination(
      icon: Icon(Icons.videocam_outlined),
      selectedIcon: Icon(Icons.videocam),
      label: 'Analysis',
    ),
    const NavigationDestination(
      icon: Icon(Icons.event_outlined),
      selectedIcon: Icon(Icons.event),
      label: 'Meets',
    ),
    const NavigationDestination(
      icon: Icon(Icons.chat_outlined),
      selectedIcon: Icon(Icons.chat),
      label: 'Chat',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
          
          switch (index) {
            case 0:
              context.go('/');
              break;
            case 1:
              context.go('/training');
              break;
            case 2:
              context.go('/video-analysis');
              break;
            case 3:
              context.go('/meets');
              break;
            case 4:
              context.go('/chat');
              break;
          }
        },
        destinations: _destinations,
      ),
    );
  }
}