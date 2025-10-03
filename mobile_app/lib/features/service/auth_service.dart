import '../model/auth/login_request.dart';
import '../model/auth/login_response.dart';
import '../../core/network/api_network.dart';
import '../../core/config/api_config.dart';

class AuthService {
  // Login method
  static Future<LoginResponse> login(LoginRequest loginRequest) async {
    try {
      final response = await ApiNetwork.postWithoutAuth(
        endpoint: ApiConfig.loginEndpoint,
        body: loginRequest.toJson(),
      );

      return LoginResponse.fromJson(response);
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  // Example method for authenticated requests
  static Future<Map<String, dynamic>> getUserProfile(String token) async {
    try {
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.userProfileEndpoint,
        token: token,
      );

      return response;
    } catch (e) {
      throw Exception('Failed to get user profile: $e');
    }
  }

  // Example method for updating user profile
  static Future<Map<String, dynamic>> updateUserProfile({
    required String token,
    required Map<String, dynamic> userData,
  }) async {
    try {
      final response = await ApiNetwork.putWithAuth(
        endpoint: ApiConfig.userProfileEndpoint,
        token: token,
        body: userData,
      );

      return response;
    } catch (e) {
      throw Exception('Failed to update user profile: $e');
    }
  }

  // Example method for logout
  static Future<Map<String, dynamic>> logout(String token) async {
    return {};
  }
}
