import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ApiNetwork {
  static Future<bool> testConnectivity() async {
    try {
      debugPrint('Testing connectivity to: ${ApiConfig.baseUrl}');

      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/health'))
          .timeout(
            const Duration(seconds: 5),
            onTimeout: () {
              throw Exception('Connectivity test timeout');
            },
          );

      debugPrint('Connectivity test successful: ${response.statusCode}');
      return response.statusCode < 500;
    } catch (e) {
      debugPrint('Connectivity test failed: $e');

      try {
        final response = await http
            .post(
              Uri.parse('${ApiConfig.baseUrl}${ApiConfig.loginEndpoint}'),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({'email': 'test', 'password': 'test'}),
            )
            .timeout(
              const Duration(seconds: 5),
              onTimeout: () {
                throw Exception('Login endpoint test timeout');
              },
            );
        return true;
      } catch (e2) {
        debugPrint('Login endpoint test failed: $e2');
        return false;
      }
    }
  }

  // Method for API calls without Bearer token
  static Future<Map<String, dynamic>> postWithoutAuth({
    required String endpoint,
    required Map<String, dynamic> body,
    Map<String, String>? additionalHeaders,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');

      debugPrint(' POST Request URL: $url');
      debugPrint(' Request Body: ${jsonEncode(body)}');

      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...?additionalHeaders,
      };

      debugPrint(' Request Headers: $headers');

      final response = await http
          .post(url, headers: headers, body: jsonEncode(body))
          .timeout(
            ApiConfig.requestTimeout,
            onTimeout: () {
              throw Exception(
                'Request timeout after ${ApiConfig.requestTimeout.inSeconds} seconds',
              );
            },
          );

      debugPrint(' Response Status: ${response.statusCode}');
      debugPrint(' Response Body: ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      debugPrint(' Network Error: $e');
      if (e.toString().contains('timeout')) {
        throw Exception(
          'Request timed out. Please check your internet connection and try again.',
        );
      } else if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection refused')) {
        throw Exception(
          'Cannot connect to server. Please check your internet connection.',
        );
      } else {
        throw Exception('Network error: $e');
      }
    }
  }

  // Method for API calls with Bearer token
  static Future<Map<String, dynamic>> postWithAuth({
    required String endpoint,
    required Map<String, dynamic> body,
    required String token,
    Map<String, String>? additionalHeaders,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');

      debugPrint(' POST Request URL: $url');
      debugPrint(' Request Body: ${jsonEncode(body)}');

      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        ...?additionalHeaders,
      };

      debugPrint(' Request Headers: $headers');

      final response = await http
          .post(url, headers: headers, body: jsonEncode(body))
          .timeout(
            ApiConfig.requestTimeout,
            onTimeout: () {
              throw Exception(
                'Request timeout after ${ApiConfig.requestTimeout.inSeconds} seconds',
              );
            },
          );

      debugPrint(' Response Status: ${response.statusCode}');
      debugPrint(' Response Body: ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      debugPrint(' Network Error: $e');
      if (e.toString().contains('timeout')) {
        throw Exception(
          'Request timed out. Please check your internet connection and try again.',
        );
      } else if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection refused')) {
        throw Exception(
          'Cannot connect to server. Please check your internet connection.',
        );
      } else {
        throw Exception('Network error: $e');
      }
    }
  }

  // Method for GET requests without Bearer token
  static Future<Map<String, dynamic>> getWithoutAuth({
    required String endpoint,
    Map<String, String>? queryParameters,
    Map<String, String>? additionalHeaders,
  }) async {
    try {
      Uri url = Uri.parse('${ApiConfig.baseUrl}$endpoint');

      if (queryParameters != null && queryParameters.isNotEmpty) {
        url = url.replace(queryParameters: queryParameters);
      }

      debugPrint(' GET Request URL: $url');

      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...?additionalHeaders,
      };

      debugPrint(' Request Headers: $headers');

      final response = await http
          .get(url, headers: headers)
          .timeout(
            ApiConfig.requestTimeout,
            onTimeout: () {
              throw Exception(
                'Request timeout after ${ApiConfig.requestTimeout.inSeconds} seconds',
              );
            },
          );

      debugPrint(' Response Status: ${response.statusCode}');
      debugPrint(' Response Body: ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      debugPrint(' Network Error: $e');
      if (e.toString().contains('timeout')) {
        throw Exception(
          'Request timed out. Please check your internet connection and try again.',
        );
      } else if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection refused')) {
        throw Exception(
          'Cannot connect to server. Please check your internet connection.',
        );
      } else {
        throw Exception('Network error: $e');
      }
    }
  }

  // Method for GET requests with Bearer token
  static Future<Map<String, dynamic>> getWithAuth({
    required String endpoint,
    required String token,
    Map<String, String>? queryParameters,
    Map<String, String>? additionalHeaders,
  }) async {
    try {
      Uri url = Uri.parse('${ApiConfig.baseUrl}$endpoint');

      if (queryParameters != null && queryParameters.isNotEmpty) {
        url = url.replace(queryParameters: queryParameters);
      }

      debugPrint(' GET Request URL: $url');

      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        ...?additionalHeaders,
      };

      debugPrint(' Request Headers: $headers');

      final response = await http
          .get(url, headers: headers)
          .timeout(
            ApiConfig.requestTimeout,
            onTimeout: () {
              throw Exception(
                'Request timeout after ${ApiConfig.requestTimeout.inSeconds} seconds',
              );
            },
          );

      debugPrint(' Response Status: ${response.statusCode}');
      debugPrint(' Response Body: ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      debugPrint(' Network Error: $e');
      if (e.toString().contains('timeout')) {
        throw Exception(
          'Request timed out. Please check your internet connection and try again.',
        );
      } else if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection refused')) {
        throw Exception(
          'Cannot connect to server. Please check your internet connection.',
        );
      } else {
        throw Exception('Network error: $e');
      }
    }
  }

  // Method for PUT requests without Bearer token
  static Future<Map<String, dynamic>> putWithoutAuth({
    required String endpoint,
    required Map<String, dynamic> body,
    Map<String, String>? additionalHeaders,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');

      debugPrint(' PUT Request URL: $url');
      debugPrint(' Request Body: ${jsonEncode(body)}');

      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...?additionalHeaders,
      };

      debugPrint(' Request Headers: $headers');

      final response = await http
          .put(url, headers: headers, body: jsonEncode(body))
          .timeout(
            ApiConfig.requestTimeout,
            onTimeout: () {
              throw Exception(
                'Request timeout after ${ApiConfig.requestTimeout.inSeconds} seconds',
              );
            },
          );

      debugPrint(' Response Status: ${response.statusCode}');
      debugPrint(' Response Body: ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      debugPrint(' Network Error: $e');
      if (e.toString().contains('timeout')) {
        throw Exception(
          'Request timed out. Please check your internet connection and try again.',
        );
      } else if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection refused')) {
        throw Exception(
          'Cannot connect to server. Please check your internet connection.',
        );
      } else {
        throw Exception('Network error: $e');
      }
    }
  }

  // Method for PUT requests with Bearer token
  static Future<Map<String, dynamic>> putWithAuth({
    required String endpoint,
    required Map<String, dynamic> body,
    required String token,
    Map<String, String>? additionalHeaders,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');

      debugPrint(' PUT Request URL: $url');
      debugPrint(' Request Body: ${jsonEncode(body)}');

      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        ...?additionalHeaders,
      };

      debugPrint(' Request Headers: $headers');

      final response = await http
          .put(url, headers: headers, body: jsonEncode(body))
          .timeout(
            ApiConfig.requestTimeout,
            onTimeout: () {
              throw Exception(
                'Request timeout after ${ApiConfig.requestTimeout.inSeconds} seconds',
              );
            },
          );

      debugPrint(' Response Status: ${response.statusCode}');
      debugPrint(' Response Body: ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      debugPrint(' Network Error: $e');
      if (e.toString().contains('timeout')) {
        throw Exception(
          'Request timed out. Please check your internet connection and try again.',
        );
      } else if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection refused')) {
        throw Exception(
          'Cannot connect to server. Please check your internet connection.',
        );
      } else {
        throw Exception('Network error: $e');
      }
    }
  }

  // Method for DELETE requests without Bearer token
  static Future<Map<String, dynamic>> deleteWithoutAuth({
    required String endpoint,
    Map<String, String>? additionalHeaders,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');

      debugPrint(' DELETE Request URL: $url');

      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...?additionalHeaders,
      };

      debugPrint(' Request Headers: $headers');

      final response = await http
          .delete(url, headers: headers)
          .timeout(
            ApiConfig.requestTimeout,
            onTimeout: () {
              throw Exception(
                'Request timeout after ${ApiConfig.requestTimeout.inSeconds} seconds',
              );
            },
          );

      debugPrint(' Response Status: ${response.statusCode}');
      debugPrint(' Response Body: ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      debugPrint(' Network Error: $e');
      if (e.toString().contains('timeout')) {
        throw Exception(
          'Request timed out. Please check your internet connection and try again.',
        );
      } else if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection refused')) {
        throw Exception(
          'Cannot connect to server. Please check your internet connection.',
        );
      } else {
        throw Exception('Network error: $e');
      }
    }
  }

  // Method for DELETE requests with Bearer token
  static Future<Map<String, dynamic>> deleteWithAuth({
    required String endpoint,
    required String token,
    Map<String, String>? additionalHeaders,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');

      debugPrint(' DELETE Request URL: $url');

      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        ...?additionalHeaders,
      };

      debugPrint(' Request Headers: $headers');

      final response = await http
          .delete(url, headers: headers)
          .timeout(
            ApiConfig.requestTimeout,
            onTimeout: () {
              throw Exception(
                'Request timeout after ${ApiConfig.requestTimeout.inSeconds} seconds',
              );
            },
          );

      debugPrint(' Response Status: ${response.statusCode}');
      debugPrint(' Response Body: ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      debugPrint(' Network Error: $e');
      if (e.toString().contains('timeout')) {
        throw Exception(
          'Request timed out. Please check your internet connection and try again.',
        );
      } else if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection refused')) {
        throw Exception(
          'Cannot connect to server. Please check your internet connection.',
        );
      } else {
        throw Exception('Network error: $e');
      }
    }
  }

  // Handle HTTP response
  static Map<String, dynamic> _handleResponse(http.Response response) {
    debugPrint(' Processing response with status: ${response.statusCode}');

    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        final responseData = jsonDecode(response.body) as Map<String, dynamic>;
        debugPrint(' Response parsed successfully');
        return responseData;
      } catch (e) {
        debugPrint(' Failed to parse response: $e');
        throw Exception('Failed to parse response: $e');
      }
    } else {
      debugPrint(' HTTP Error: ${response.statusCode} - ${response.body}');
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    }
  }
}
