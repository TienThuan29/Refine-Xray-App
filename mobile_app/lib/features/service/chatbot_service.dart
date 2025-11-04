import 'dart:convert';
import 'package:http/http.dart' as http;
import '../model/chat/chat_models.dart';
import '../../core/config/api_config.dart';

class ChatbotService {
  static String get _baseUrl => ApiConfig.baseUrl;
  static const String _chatSessionEndpoint = '/api/v1/chatsessions';
  
  // Send message to chatbot
  static Future<ChatbotResponse> sendMessage({
    required String chatSessionId,
    required String accessToken,
    required ChatbotRequest request,
  }) async {
    try {
      final url = Uri.parse('$_baseUrl$_chatSessionEndpoint/$chatSessionId/chat');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode(request.toJson()),
      );

      print('Chatbot API Response Status: ${response.statusCode}');
      print('Chatbot API Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        
        if (data['success'] == true) {
          return ChatbotResponse.fromJson(data['dataResponse']);
        } else {
          throw Exception(data['message'] ?? 'Failed to send message');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: Failed to send message');
      }
    } catch (e) {
      print('Error in sendMessage: $e');
      throw Exception('Failed to send message: $e');
    }
  }

  // Get chat session
  static Future<ChatSession> getChatSession({
    required String chatSessionId,
    required String accessToken,
  }) async {
    try {
      final url = Uri.parse('$_baseUrl$_chatSessionEndpoint/get/$chatSessionId');
      
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      );

      print('Get Chat Session API Response Status: ${response.statusCode}');
      print('Get Chat Session API Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        
        if (data['success'] == true) {
          return ChatSession.fromJson(data['dataResponse']);
        } else {
          throw Exception(data['message'] ?? 'Failed to get chat session');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: Failed to get chat session');
      }
    } catch (e) {
      print('Error in getChatSession: $e');
      throw Exception('Failed to get chat session: $e');
    }
  }

  // Create chat session (if needed for future)
  static Future<ChatSession> createChatSession({
    required String title,
    required String folderId,
    required String accessToken,
    String? xrayImagePath,
  }) async {
    try {
      final url = Uri.parse('$_baseUrl$_chatSessionEndpoint/analyze-and-create-chatsession');
      
      var request = http.MultipartRequest('POST', url);
      request.headers['Authorization'] = 'Bearer $accessToken';
      
      request.fields['title'] = title;
      request.fields['folderId'] = folderId;
      
      if (xrayImagePath != null) {
        request.files.add(await http.MultipartFile.fromPath('xrayImage', xrayImagePath));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      print('Create Chat Session API Response Status: ${response.statusCode}');
      print('Create Chat Session API Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        
        if (data['success'] == true) {
          return ChatSession.fromJson(data['dataResponse']);
        } else {
          throw Exception(data['message'] ?? 'Failed to create chat session');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: Failed to create chat session');
      }
    } catch (e) {
      print('Error in createChatSession: $e');
      throw Exception('Failed to create chat session: $e');
    }
  }
}