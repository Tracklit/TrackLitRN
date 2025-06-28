import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/meets_provider.dart';
import '../../models/meet.dart';

class MeetsScreen extends ConsumerWidget {
  const MeetsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meetsAsync = ref.watch(meetsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Meets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showCreateMeetDialog(context, ref),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.read(meetsProvider.notifier).refresh();
        },
        child: meetsAsync.when(
          data: (meets) => _buildMeetsList(context, meets),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text('Error loading meets: $error'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.refresh(meetsProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMeetsList(BuildContext context, List<Meet> meets) {
    if (meets.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.event_available,
                size: 80,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 24),
              Text(
                'No Meets Scheduled',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Create your first meet to start tracking competitions and events',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 32),
              FilledButton.icon(
                onPressed: () => _showCreateMeetDialog(context, ProviderScope.containerOf(context).read(meetsProvider.notifier)),
                icon: const Icon(Icons.event_note),
                label: const Text('Create Meet'),
              ),
            ],
          ),
        ),
      );
    }

    // Group meets by status
    final upcomingMeets = meets.where((meet) => meet.status == 'upcoming').toList();
    final completedMeets = meets.where((meet) => meet.status == 'completed').toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (upcomingMeets.isNotEmpty) ...[
          Text(
            'Upcoming Meets',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ...upcomingMeets.map((meet) => _buildMeetCard(context, meet)),
          const SizedBox(height: 24),
        ],
        
        if (completedMeets.isNotEmpty) ...[
          Text(
            'Past Meets',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ...completedMeets.map((meet) => _buildMeetCard(context, meet)),
        ],
      ],
    );
  }

  Widget _buildMeetCard(BuildContext context, Meet meet) {
    final isUpcoming = meet.status == 'upcoming';
    final daysDifference = meet.date.difference(DateTime.now()).inDays;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () => _showMeetDetails(context, meet),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isUpcoming 
                          ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                          : Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.event,
                      color: isUpcoming 
                          ? Theme.of(context).colorScheme.primary
                          : Colors.grey,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          meet.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          meet.location,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isUpcoming)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: daysDifference <= 7 
                            ? Colors.orange.withOpacity(0.1)
                            : Theme.of(context).colorScheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        daysDifference == 0 
                            ? 'Today'
                            : daysDifference == 1 
                                ? 'Tomorrow'
                                : '$daysDifference days',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: daysDifference <= 7 
                              ? Colors.orange
                              : Theme.of(context).colorScheme.primary,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              
              Text(
                _formatDate(meet.date),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 8),
              
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: meet.events.take(3).map((event) => Chip(
                  label: Text(
                    event,
                    style: const TextStyle(fontSize: 12),
                  ),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                )).toList(),
              ),
              
              if (meet.events.length > 3) ...[
                const SizedBox(height: 4),
                Text(
                  '+${meet.events.length - 3} more events',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now).inDays;
    
    if (difference == 0) return 'Today';
    if (difference == 1) return 'Tomorrow';
    if (difference == -1) return 'Yesterday';
    
    final weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.weekday - 1];
    final month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.month - 1];
    
    return '$weekday, $month ${date.day}, ${date.year}';
  }

  void _showCreateMeetDialog(BuildContext context, dynamic meetsNotifier) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _CreateMeetDialog(meetsNotifier: meetsNotifier),
    );
  }

  void _showMeetDetails(BuildContext context, Meet meet) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _MeetDetailsSheet(meet: meet),
    );
  }
}

class _CreateMeetDialog extends StatefulWidget {
  final dynamic meetsNotifier;

  const _CreateMeetDialog({required this.meetsNotifier});

  @override
  State<_CreateMeetDialog> createState() => _CreateMeetDialogState();
}

class _CreateMeetDialogState extends State<_CreateMeetDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _locationController = TextEditingController();
  final _websiteController = TextEditingController();
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 7));
  final List<String> _selectedEvents = [];
  
  final List<String> _availableEvents = [
    '100m', '200m', '400m', '800m', '1500m', '5000m', '10000m',
    '100m Hurdles', '110m Hurdles', '400m Hurdles',
    'Long Jump', 'High Jump', 'Pole Vault', 'Triple Jump',
    'Shot Put', 'Discus', 'Hammer', 'Javelin',
    '4x100m Relay', '4x400m Relay',
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.8,
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Create Meet',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Meet Name',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter a meet name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      TextFormField(
                        controller: _locationController,
                        decoration: const InputDecoration(
                          labelText: 'Location',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter a location';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      ListTile(
                        title: const Text('Date'),
                        subtitle: Text(_formatDate(_selectedDate)),
                        trailing: const Icon(Icons.calendar_today),
                        onTap: _selectDate,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: BorderSide(color: Colors.grey[400]!),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      TextFormField(
                        controller: _websiteController,
                        decoration: const InputDecoration(
                          labelText: 'Website URL (optional)',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      Text(
                        'Select Events',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _availableEvents.map((event) => FilterChip(
                          label: Text(event),
                          selected: _selectedEvents.contains(event),
                          onSelected: (selected) {
                            setState(() {
                              if (selected) {
                                _selectedEvents.add(event);
                              } else {
                                _selectedEvents.remove(event);
                              }
                            });
                          },
                        )).toList(),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: FilledButton(
                      onPressed: _createMeet,
                      child: const Text('Create Meet'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (date != null) {
      setState(() {
        _selectedDate = date;
      });
    }
  }

  Future<void> _createMeet() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedEvents.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one event'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final request = CreateMeetRequest(
      name: _nameController.text.trim(),
      date: _selectedDate,
      location: _locationController.text.trim(),
      events: _selectedEvents,
      websiteUrl: _websiteController.text.trim().isNotEmpty 
          ? _websiteController.text.trim() 
          : null,
    );

    final success = await widget.meetsNotifier.createMeet(request);

    if (success && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Meet created successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to create meet'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  String _formatDate(DateTime date) {
    final weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.weekday - 1];
    final month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.month - 1];
    
    return '$weekday, $month ${date.day}, ${date.year}';
  }
}

class _MeetDetailsSheet extends StatelessWidget {
  final Meet meet;

  const _MeetDetailsSheet({required this.meet});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  meet.name,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          _buildDetailRow(context, Icons.location_on, 'Location', meet.location),
          _buildDetailRow(context, Icons.calendar_today, 'Date', _formatDate(meet.date)),
          if (meet.websiteUrl != null)
            _buildDetailRow(context, Icons.link, 'Website', meet.websiteUrl!),
          
          const SizedBox(height: 24),
          Text(
            'Events',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: meet.events.length,
              itemBuilder: (context, index) => Card(
                child: Center(
                  child: Text(
                    meet.events[index],
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          if (meet.status == 'upcoming')
            FilledButton(
              onPressed: () {},
              child: const SizedBox(
                width: double.infinity,
                child: Text(
                  'Add to Calendar',
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 12),
          Text(
            '$label: ',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final weekday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][date.weekday - 1];
    final month = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'][date.month - 1];
    
    return '$weekday, $month ${date.day}, ${date.year}';
  }
}