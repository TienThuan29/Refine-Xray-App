import '../model/auth/login_request.dart';
import '../model/auth/login_response.dart';
import '../model/auth/register_request.dart';
import '../../core/network/api_network.dart';
import '../../core/config/api_config.dart';
import '../../core/storage/token_storage.dart';

class AuthService {
  // Login method
  static Future<LoginResponse> login(LoginRequest loginRequest) async {
    try {
      final response = await ApiNetwork.postWithoutAuth(
        endpoint: ApiConfig.loginEndpoint,
        body: loginRequest.toJson(),
      );

      final loginResponse = LoginResponse.fromJson(response);

      // Save tokens to local storage if login successful
      if (loginResponse.success && loginResponse.dataResponse != null) {
        await TokenStorage.saveTokens(
          accessToken: loginResponse.dataResponse!.accessToken,
          refreshToken: loginResponse.dataResponse!.refreshToken,
        );
      }

      return loginResponse;
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  // Register method
  static Future<LoginResponse> register(RegisterRequest registerRequest) async {
    try {
      final response = await ApiNetwork.postWithoutAuth(
        endpoint: ApiConfig.registerEndpoint,
        body: registerRequest.toJson(),
      );

      final registerResponse = LoginResponse.fromJson(response);

      // Save tokens to local storage if registration successful
      if (registerResponse.success && registerResponse.dataResponse != null) {
        await TokenStorage.saveTokens(
          accessToken: registerResponse.dataResponse!.accessToken,
          refreshToken: registerResponse.dataResponse!.refreshToken,
        );
      }

      return registerResponse;
    } catch (e) {
      throw Exception('Registration failed: $e');
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
