import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/meets_provider.dart';
import '../../providers/video_analysis_provider.dart';
import '../../models/user.dart';
import '../../widgets/common/loading_overlay.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);
    final meetsAsync = ref.watch(meetsProvider);
    final videoAnalysisAsync = ref.watch(videoAnalysisProvider);

    return userAsync.when(
      data: (user) {
        if (user == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            context.go('/auth');
          });
          return const SizedBox();
        }
        
        return Scaffold(
          appBar: AppBar(
            title: Text('Welcome, ${user.name}'),
            actions: [
              IconButton(
                icon: const Icon(Icons.person),
                onPressed: () => context.go('/profile'),
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () async {
              ref.read(meetsProvider.notifier).refresh();
              ref.read(videoAnalysisProvider.notifier).refresh();
            },
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Stats Card
                  _buildStatsCard(context, user),
                  const SizedBox(height: 24),
                  
                  // Quick Actions
                  _buildQuickActions(context, user),
                  const SizedBox(height: 24),
                  
                  // Recent Meets
                  Text(
                    'Upcoming Meets',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  meetsAsync.when(
                    data: (meets) => _buildRecentMeets(context, meets.take(3).toList()),
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (error, stack) => Text('Error loading meets: $error'),
                  ),
                  const SizedBox(height: 24),
                  
                  // Recent Video Analysis
                  Text(
                    'Recent Video Analysis',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  videoAnalysisAsync.when(
                    data: (analyses) => _buildRecentAnalyses(context, analyses.take(3).toList()),
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (error, stack) => Text('Error loading analyses: $error'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stack) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error: $error'),
              ElevatedButton(
                onPressed: () => ref.refresh(currentUserProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsCard(BuildContext context, User user) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: user.profileImageUrl != null
                      ? NetworkImage(user.profileImageUrl!)
                      : null,
                  child: user.profileImageUrl == null
                      ? Text(
                          user.name.substring(0, 1).toUpperCase(),
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                        )
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.name,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        user.role.toUpperCase(),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (user.isPremium)
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            user.subscriptionTier.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    context,
                    'Spikes',
                    user.spikes.toString(),
                    Icons.bolt,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    context,
                    'AI Prompts',
                    user.sprinthiaPrompts.toString(),
                    Icons.psychology,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(BuildContext context, String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context, User user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            _buildActionCard(
              context,
              'New Meet',
              Icons.event_note,
              () => context.go('/meets'),
            ),
            _buildActionCard(
              context,
              'Video Analysis',
              Icons.videocam,
              () => context.go('/video-analysis'),
            ),
            _buildActionCard(
              context,
              'Training',
              Icons.fitness_center,
              () => context.go('/training'),
            ),
            _buildActionCard(
              context,
              'Chat',
              Icons.chat,
              () => context.go('/chat'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(BuildContext context, String title, IconData icon, VoidCallback onTap) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 32,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecentMeets(BuildContext context, List meets) {
    if (meets.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Icon(
                Icons.event_available,
                size: 48,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 12),
              Text(
                'No upcoming meets',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Create your first meet to get started',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go('/meets'),
                child: const Text('Create Meet'),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: meets.map((meet) => Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: const Icon(Icons.event),
          title: Text(meet.name),
          subtitle: Text('${meet.location} • ${meet.date.toString().split(' ')[0]}'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.go('/meets'),
        ),
      )).toList(),
    );
  }

  Widget _buildRecentAnalyses(BuildContext context, List analyses) {
    if (analyses.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Icon(
                Icons.videocam_off,
                size: 48,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 12),
              Text(
                'No video analyses',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Upload a video to analyze your technique',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go('/video-analysis'),
                child: const Text('Start Analysis'),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: analyses.map((analysis) => Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: const Icon(Icons.play_circle),
          title: Text(analysis.name),
          subtitle: Text('${analysis.analysisType} • ${analysis.status}'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.go('/video-analysis'),
        ),
      )).toList(),
    );
  }
}