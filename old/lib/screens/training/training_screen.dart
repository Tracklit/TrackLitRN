import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class TrainingScreen extends ConsumerWidget {
  const TrainingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Training'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showCreateWorkoutDialog(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Training Overview Card
            _buildTrainingOverview(context),
            const SizedBox(height: 24),
            
            // Quick Training Tools
            _buildQuickTools(context),
            const SizedBox(height: 24),
            
            // Recent Workouts
            Text(
              'Recent Workouts',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildRecentWorkouts(context),
            const SizedBox(height: 24),
            
            // Training Programs
            Text(
              'Training Programs',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildTrainingPrograms(context),
          ],
        ),
      ),
    );
  }

  Widget _buildTrainingOverview(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This Week',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatColumn(context, '5', 'Workouts', Icons.fitness_center),
                ),
                Expanded(
                  child: _buildStatColumn(context, '12.5km', 'Distance', Icons.straighten),
                ),
                Expanded(
                  child: _buildStatColumn(context, '3h 45m', 'Time', Icons.timer),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatColumn(BuildContext context, String value, String label, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 8),
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

  Widget _buildQuickTools(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Training Tools',
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
            _buildToolCard(context, 'Stopwatch', Icons.timer, () {}),
            _buildToolCard(context, 'Interval Timer', Icons.schedule, () {}),
            _buildToolCard(context, 'Pace Calculator', Icons.speed, () {}),
            _buildToolCard(context, 'Start Gun', Icons.sports, () {}),
          ],
        ),
      ],
    );
  }

  Widget _buildToolCard(BuildContext context, String title, IconData icon, VoidCallback onTap) {
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

  Widget _buildRecentWorkouts(BuildContext context) {
    final workouts = [
      {'name': 'Sprint Intervals', 'date': 'Today', 'duration': '45 min'},
      {'name': 'Endurance Run', 'date': 'Yesterday', 'duration': '60 min'},
      {'name': 'Block Starts', 'date': '2 days ago', 'duration': '30 min'},
    ];

    return Column(
      children: workouts.map((workout) => Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: const Icon(Icons.fitness_center),
          title: Text(workout['name']!),
          subtitle: Text('${workout['date']} • ${workout['duration']}'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {},
        ),
      )).toList(),
    );
  }

  Widget _buildTrainingPrograms(BuildContext context) {
    final programs = [
      {'name': '100m Sprint Program', 'weeks': '8 weeks', 'progress': 0.6},
      {'name': 'Long Jump Training', 'weeks': '12 weeks', 'progress': 0.3},
    ];

    return Column(
      children: programs.map((program) => Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      program['name']!,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    program['weeks']!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: program['progress'] as double,
                backgroundColor: Colors.grey[300],
              ),
              const SizedBox(height: 4),
              Text(
                '${((program['progress'] as double) * 100).toInt()}% Complete',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      )).toList(),
    );
  }

  void _showCreateWorkoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Workout'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(
                labelText: 'Workout Name',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                labelText: 'Duration (minutes)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}