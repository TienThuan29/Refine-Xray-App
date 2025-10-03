import 'login_data_response.dart';

class LoginResponse {
  final bool success;
  final String message;
  final LoginDataResponse? dataResponse;
  final String? error;
  final String? stack;

  LoginResponse({
    required this.success,
    required this.message,
    this.dataResponse,
    this.error,
    this.stack,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      dataResponse: json['dataResponse'] != null
          ? LoginDataResponse.fromJson(json['dataResponse'])
          : null,
      error: json['error'],
      stack: json['stack'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'dataResponse': dataResponse?.toJson(),
      'error': error,
      'stack': stack,
    };
  }
}
