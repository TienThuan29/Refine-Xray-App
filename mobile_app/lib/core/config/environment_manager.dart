import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvironmentManager {
  // Environment types
  static const String development = 'development';
  static const String staging = 'staging';
  static const String production = 'production';

  // Get current environment
  static String get currentEnvironment {
    return dotenv.env['ENVIRONMENT'] ?? development;
  }

  // Check if current environment is development
  static bool get isDevelopment => currentEnvironment == development;

  // Check if current environment is staging
  static bool get isStaging => currentEnvironment == staging;

  // Check if current environment is production
  static bool get isProduction => currentEnvironment == production;

  // Get environment-specific configuration
  static Map<String, String> getEnvironmentConfig() {
    switch (currentEnvironment) {
      case development:
        return {'BASE_URL': '', 'DEBUG_MODE': 'true', 'LOG_LEVEL': 'debug'};
      case staging:
        return {'BASE_URL': '', 'DEBUG_MODE': 'true', 'LOG_LEVEL': 'info'};
      case production:
        return {'BASE_URL': '', 'DEBUG_MODE': 'false', 'LOG_LEVEL': 'error'};
      default:
        return {'BASE_URL': '', 'DEBUG_MODE': 'true', 'LOG_LEVEL': 'debug'};
    }
  }

  // Validate environment variables
  static List<String> validateEnvironment() {
    List<String> missingVars = [];

    final requiredVars = ['BASE_URL', 'LOGIN_ENDPOINT'];

    for (String varName in requiredVars) {
      if (dotenv.env[varName] == null || dotenv.env[varName]!.isEmpty) {
        missingVars.add(varName);
      }
    }

    return missingVars;
  }

  // Print environment info (for debugging)
  static void printEnvironmentInfo() {
    // Debug prints removed for production
  }
}
