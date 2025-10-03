import 'user_profile.dart';

class LoginDataResponse {
  final UserProfile userProfile;
  final String accessToken;
  final String refreshToken;

  LoginDataResponse({
    required this.userProfile,
    required this.accessToken,
    required this.refreshToken,
  });

  factory LoginDataResponse.fromJson(Map<String, dynamic> json) {
    return LoginDataResponse(
      userProfile: UserProfile.fromJson(json['userProfile'] ?? {}),
      accessToken: json['accessToken'] ?? '',
      refreshToken: json['refreshToken'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userProfile': userProfile.toJson(),
      'accessToken': accessToken,
      'refreshToken': refreshToken,
    };
  }
}
