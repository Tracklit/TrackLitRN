import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../providers/video_analysis_provider.dart';
import '../../models/video_analysis.dart';
import '../../widgets/common/loading_overlay.dart';

class VideoAnalysisScreen extends ConsumerStatefulWidget {
  const VideoAnalysisScreen({super.key});

  @override
  ConsumerState<VideoAnalysisScreen> createState() => _VideoAnalysisScreenState();
}

class _VideoAnalysisScreenState extends ConsumerState<VideoAnalysisScreen> {
  bool _isUploading = false;
  
  final List<String> _analysisTypes = [
    'sprint-form',
    'block-start',
    'stride-length',
    'stride-frequency',
    'ground-contact',
  ];

  final Map<String, String> _analysisTypeLabels = {
    'sprint-form': 'Sprint Form Analysis',
    'block-start': 'Starting Blocks',
    'stride-length': 'Stride Length',
    'stride-frequency': 'Stride Frequency',
    'ground-contact': 'Ground Contact',
  };

  @override
  Widget build(BuildContext context) {
    final videoAnalysisAsync = ref.watch(videoAnalysisProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Video Analysis'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle),
            onPressed: _showCreateAnalysisDialog,
          ),
        ],
      ),
      body: LoadingOverlay(
        isLoading: _isUploading,
        message: 'Uploading and processing video...',
        child: RefreshIndicator(
          onRefresh: () async {
            ref.read(videoAnalysisProvider.notifier).refresh();
          },
          child: videoAnalysisAsync.when(
            data: (analyses) => _buildAnalysesList(context, analyses),
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
                  Text('Error loading analyses: $error'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ref.refresh(videoAnalysisProvider),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAnalysesList(BuildContext context, List<VideoAnalysis> analyses) {
    if (analyses.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.videocam_off,
                size: 80,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 24),
              Text(
                'No Video Analyses',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Upload your first training video to get started with AI-powered biomechanical analysis',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 32),
              FilledButton.icon(
                onPressed: _showCreateAnalysisDialog,
                icon: const Icon(Icons.video_call),
                label: const Text('Upload Video'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: analyses.length,
      itemBuilder: (context, index) {
        final analysis = analyses[index];
        return _buildAnalysisCard(context, analysis);
      },
    );
  }

  Widget _buildAnalysisCard(BuildContext context, VideoAnalysis analysis) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () => _showAnalysisDetails(analysis),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: analysis.thumbnailUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              analysis.thumbnailUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Icon(
                                Icons.video_library,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          )
                        : Icon(
                            Icons.video_library,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          analysis.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _analysisTypeLabels[analysis.analysisType] ?? analysis.analysisType,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          analysis.description,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  _buildStatusChip(context, analysis.status),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Created: ${analysis.createdAt.toString().split(' ')[0]}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  if (analysis.status == 'completed' && analysis.aiAnalysis != null)
                    TextButton.icon(
                      onPressed: () => _showAnalysisDetails(analysis),
                      icon: const Icon(Icons.analytics, size: 16),
                      label: const Text('View Results'),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(BuildContext context, String status) {
    Color color;
    IconData icon;
    
    switch (status) {
      case 'completed':
        color = Colors.green;
        icon = Icons.check_circle;
        break;
      case 'processing':
        color = Colors.orange;
        icon = Icons.hourglass_empty;
        break;
      case 'failed':
        color = Colors.red;
        icon = Icons.error;
        break;
      default:
        color = Colors.grey;
        icon = Icons.pending;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            status.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateAnalysisDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _CreateAnalysisDialog(
        onAnalysisCreated: (analysis) async {
          // Show video picker after analysis is created
          final picker = ImagePicker();
          final videoFile = await picker.pickVideo(source: ImageSource.gallery);
          
          if (videoFile != null) {
            setState(() {
              _isUploading = true;
            });
            
            final success = await ref.read(videoAnalysisProvider.notifier)
                .uploadVideo(analysis.id, File(videoFile.path));
            
            setState(() {
              _isUploading = false;
            });
            
            if (!success && mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Failed to upload video'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          }
        },
      ),
    );
  }

  void _showAnalysisDetails(VideoAnalysis analysis) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _AnalysisDetailsSheet(analysis: analysis),
    );
  }
}

class _CreateAnalysisDialog extends ConsumerStatefulWidget {
  final Function(VideoAnalysis) onAnalysisCreated;

  const _CreateAnalysisDialog({required this.onAnalysisCreated});

  @override
  ConsumerState<_CreateAnalysisDialog> createState() => _CreateAnalysisDialogState();
}

class _CreateAnalysisDialogState extends ConsumerState<_CreateAnalysisDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _selectedAnalysisType = 'sprint-form';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Create Video Analysis',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Analysis Name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a description';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              DropdownButtonFormField<String>(
                value: _selectedAnalysisType,
                decoration: const InputDecoration(
                  labelText: 'Analysis Type',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'sprint-form', child: Text('Sprint Form Analysis')),
                  DropdownMenuItem(value: 'block-start', child: Text('Starting Blocks')),
                  DropdownMenuItem(value: 'stride-length', child: Text('Stride Length')),
                  DropdownMenuItem(value: 'stride-frequency', child: Text('Stride Frequency')),
                  DropdownMenuItem(value: 'ground-contact', child: Text('Ground Contact')),
                ],
                onChanged: (value) {
                  setState(() {
                    _selectedAnalysisType = value!;
                  });
                },
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
                      onPressed: _createAnalysis,
                      child: const Text('Create & Upload Video'),
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

  Future<void> _createAnalysis() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final request = CreateVideoAnalysisRequest(
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim(),
      analysisType: _selectedAnalysisType,
    );

    final analysis = await ref.read(videoAnalysisProvider.notifier)
        .createVideoAnalysis(request);

    if (analysis != null && mounted) {
      Navigator.of(context).pop();
      widget.onAnalysisCreated(analysis);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to create analysis'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

class _AnalysisDetailsSheet extends StatelessWidget {
  final VideoAnalysis analysis;

  const _AnalysisDetailsSheet({required this.analysis});

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
                  analysis.name,
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
          
          if (analysis.videoUrl != null) ...[
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Icon(
                  Icons.play_circle_outline,
                  size: 64,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          
          Text(
            'Analysis Type',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(analysis.analysisType),
          const SizedBox(height: 16),
          
          Text(
            'Description',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(analysis.description),
          const SizedBox(height: 16),
          
          if (analysis.aiAnalysis != null) ...[
            Text(
              'AI Analysis Results',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                  ),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    analysis.aiAnalysis!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ),
            ),
          ] else ...[
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (analysis.status == 'processing') ...[
                      const CircularProgressIndicator(),
                      const SizedBox(height: 16),
                      const Text('Analysis in progress...'),
                    ] else if (analysis.status == 'failed') ...[
                      const Icon(Icons.error, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      const Text('Analysis failed'),
                    ] else ...[
                      const Icon(Icons.pending, size: 48, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('Waiting for video upload'),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}