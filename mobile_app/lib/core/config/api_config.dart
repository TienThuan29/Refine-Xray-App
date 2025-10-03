import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String get baseUrl {
    try {
      const apiBaseUrl = String.fromEnvironment('API_BASE_URL');
      if (apiBaseUrl.isNotEmpty) {
        debugPrint('Using dart-define API_BASE_URL: $apiBaseUrl');
        return apiBaseUrl;
      } else {
        throw Exception('API_BASE_URL is not set');
      }
    } catch (e) {
      debugPrint('Error getting base URL: $e');
      throw Exception('Error getting base URL: $e');
    }
  }

  static String get loginEndpoint => '/master-services/api/v1/auth/login';
  static String get userProfileEndpoint =>
      '/master-services/api/v1/auth/profile';
  static String get refreshTokenEndpoint =>
      '/master-services/api/v1/auth/refresh';

  static Duration get requestTimeout {
    try {
      final timeoutSeconds =
          int.tryParse(dotenv.env['REQUEST_TIMEOUT_SECONDS'] ?? '30') ?? 30;
      return Duration(seconds: timeoutSeconds);
    } catch (e) {
      return const Duration(seconds: 30);
    }
  }

  // Headers
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  static bool get isDebugMode {
    try {
      return dotenv.env['DEBUG_MODE']?.toLowerCase() == 'true';
    } catch (e) {
      return true;
    }
  }
}
