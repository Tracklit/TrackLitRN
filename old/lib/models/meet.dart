class Meet {
  final int id;
  final int userId;
  final int? coachId;
  final int? groupId;
  final String name;
  final DateTime date;
  final String location;
  final Map<String, dynamic>? coordinates;
  final List<String> events;
  final int warmupTime;
  final int arrivalTime;
  final String status;
  final bool isCoachAssigned;
  final String? websiteUrl;
  final DateTime createdAt;

  const Meet({
    required this.id,
    required this.userId,
    this.coachId,
    this.groupId,
    required this.name,
    required this.date,
    required this.location,
    this.coordinates,
    required this.events,
    required this.warmupTime,
    required this.arrivalTime,
    required this.status,
    required this.isCoachAssigned,
    this.websiteUrl,
    required this.createdAt,
  });

  factory Meet.fromJson(Map<String, dynamic> json) {
    return Meet(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      coachId: json['coach_id'] as int?,
      groupId: json['group_id'] as int?,
      name: json['name'] as String,
      date: DateTime.parse(json['date'] as String),
      location: json['location'] as String,
      coordinates: json['coordinates'] as Map<String, dynamic>?,
      events: List<String>.from(json['events'] as List? ?? []),
      warmupTime: json['warmup_time'] as int? ?? 60,
      arrivalTime: json['arrival_time'] as int? ?? 90,
      status: json['status'] as String? ?? 'upcoming',
      isCoachAssigned: json['is_coach_assigned'] as bool? ?? false,
      websiteUrl: json['website_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'coach_id': coachId,
      'group_id': groupId,
      'name': name,
      'date': date.toIso8601String(),
      'location': location,
      'coordinates': coordinates,
      'events': events,
      'warmup_time': warmupTime,
      'arrival_time': arrivalTime,
      'status': status,
      'is_coach_assigned': isCoachAssigned,
      'website_url': websiteUrl,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class CreateMeetRequest {
  final String name;
  final DateTime date;
  final String location;
  final Map<String, dynamic>? coordinates;
  final List<String> events;
  final int? warmupTime;
  final int? arrivalTime;
  final String? websiteUrl;

  const CreateMeetRequest({
    required this.name,
    required this.date,
    required this.location,
    this.coordinates,
    required this.events,
    this.warmupTime,
    this.arrivalTime,
    this.websiteUrl,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'date': date.toIso8601String(),
      'location': location,
      'coordinates': coordinates,
      'events': events,
      'warmup_time': warmupTime,
      'arrival_time': arrivalTime,
      'website_url': websiteUrl,
    };
  }
}