class User {
  final int id;
  final String username;
  final String name;
  final String email;
  final bool isPremium;
  final String subscriptionTier;
  final bool isCoach;
  final String role;
  final String? bio;
  final String? profileImageUrl;
  final int spikes;
  final int sprinthiaPrompts;
  final int? defaultClubId;
  final bool isBlocked;
  final bool isPrivate;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.username,
    required this.name,
    required this.email,
    required this.isPremium,
    required this.subscriptionTier,
    required this.isCoach,
    required this.role,
    this.bio,
    this.profileImageUrl,
    required this.spikes,
    required this.sprinthiaPrompts,
    this.defaultClubId,
    required this.isBlocked,
    required this.isPrivate,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      username: json['username'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      isPremium: json['is_premium'] as bool? ?? false,
      subscriptionTier: json['subscription_tier'] as String? ?? 'free',
      isCoach: json['is_coach'] as bool? ?? false,
      role: json['role'] as String? ?? 'athlete',
      bio: json['bio'] as String?,
      profileImageUrl: json['profile_image_url'] as String?,
      spikes: json['spikes'] as int? ?? 0,
      sprinthiaPrompts: json['sprinthia_prompts'] as int? ?? 1,
      defaultClubId: json['default_club_id'] as int?,
      isBlocked: json['is_blocked'] as bool? ?? false,
      isPrivate: json['is_private'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'name': name,
      'email': email,
      'is_premium': isPremium,
      'subscription_tier': subscriptionTier,
      'is_coach': isCoach,
      'role': role,
      'bio': bio,
      'profile_image_url': profileImageUrl,
      'spikes': spikes,
      'sprinthia_prompts': sprinthiaPrompts,
      'default_club_id': defaultClubId,
      'is_blocked': isBlocked,
      'is_private': isPrivate,
      'created_at': createdAt.toIso8601String(),
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? name,
    String? email,
    bool? isPremium,
    String? subscriptionTier,
    bool? isCoach,
    String? role,
    String? bio,
    String? profileImageUrl,
    int? spikes,
    int? sprinthiaPrompts,
    int? defaultClubId,
    bool? isBlocked,
    bool? isPrivate,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      name: name ?? this.name,
      email: email ?? this.email,
      isPremium: isPremium ?? this.isPremium,
      subscriptionTier: subscriptionTier ?? this.subscriptionTier,
      isCoach: isCoach ?? this.isCoach,
      role: role ?? this.role,
      bio: bio ?? this.bio,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      spikes: spikes ?? this.spikes,
      sprinthiaPrompts: sprinthiaPrompts ?? this.sprinthiaPrompts,
      defaultClubId: defaultClubId ?? this.defaultClubId,
      isBlocked: isBlocked ?? this.isBlocked,
      isPrivate: isPrivate ?? this.isPrivate,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class LoginRequest {
  final String username;
  final String password;

  const LoginRequest({
    required this.username,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'password': password,
    };
  }
}

class RegisterRequest {
  final String username;
  final String password;
  final String name;
  final String email;
  final bool isCoach;

  const RegisterRequest({
    required this.username,
    required this.password,
    required this.name,
    required this.email,
    required this.isCoach,
  });

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'password': password,
      'name': name,
      'email': email,
      'is_coach': isCoach,
    };
  }
}