class UserProfile {
  final String email;
  final String fullname;
  final String phone;
  final String dateOfBirth;
  final String role;
  final bool isEnable;
  final String? lastLoginDate;
  final String createdDate;
  final String updatedDate;

  UserProfile({
    required this.email,
    required this.fullname,
    required this.phone,
    required this.dateOfBirth,
    required this.role,
    required this.isEnable,
    this.lastLoginDate,
    required this.createdDate,
    required this.updatedDate,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      email: json['email'] ?? '',
      fullname: json['fullname'] ?? '',
      phone: json['phone'] ?? '',
      dateOfBirth: json['dateOfBirth'] ?? '',
      role: json['role'] ?? '',
      isEnable: json['isEnable'] ?? false,
      lastLoginDate: json['lastLoginDate'],
      createdDate: json['createdDate'] ?? '',
      updatedDate: json['updatedDate'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'fullname': fullname,
      'phone': phone,
      'dateOfBirth': dateOfBirth,
      'role': role,
      'isEnable': isEnable,
      'lastLoginDate': lastLoginDate,
      'createdDate': createdDate,
      'updatedDate': updatedDate,
    };
  }
}
