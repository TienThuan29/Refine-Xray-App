import '../model/chat/chat_models.dart';
import '../service/chatbot_service.dart';

class ChatSessionManager {
  String? _currentChatSessionId;
  String? _accessToken;
  ChatSession? _currentChatSession;
  
  // Setters
  void setAccessToken(String token) {
    _accessToken = token;
  }
  
  void setCurrentChatSessionId(String chatSessionId) {
    _currentChatSessionId = chatSessionId;
  }
  
  void setCurrentChatSession(ChatSession chatSession) {
    _currentChatSession = chatSession;
    _currentChatSessionId = chatSession.id;
  }
  
  // Getters
  String? get currentChatSessionId => _currentChatSessionId;
  String? get accessToken => _accessToken;
  ChatSession? get currentChatSession => _currentChatSession;
  
  // Check if ready for chat
  bool get isReady => _currentChatSessionId != null && _accessToken != null;
  
  // Send message
  Future<ChatbotResponse> sendMessage(String message) async {
    if (!isReady) {
      throw Exception('Chat session not ready. Missing session ID or access token.');
    }
    
    final request = ChatbotRequest(
      message: message,
      action: _currentChatSession?.chatItems?.isEmpty == true ? 'start_chat' : 'continue_chat',
    );
    
    return await ChatbotService.sendMessage(
      chatSessionId: _currentChatSessionId!,
      accessToken: _accessToken!,
      request: request,
    );
  }
  
  // Refresh current chat session
  Future<ChatSession> refreshChatSession() async {
    if (_currentChatSessionId == null || _accessToken == null) {
      throw Exception('Cannot refresh chat session. Missing session ID or access token.');
    }
    
    final chatSession = await ChatbotService.getChatSession(
      chatSessionId: _currentChatSessionId!,
      accessToken: _accessToken!,
    );
    
    _currentChatSession = chatSession;
    return chatSession;
  }
  
  // Create new chat session
  Future<ChatSession> createChatSession({
    required String title,
    required String folderId,
    String? xrayImagePath,
  }) async {
    if (_accessToken == null) {
      throw Exception('Cannot create chat session. Missing access token.');
    }
    
    final chatSession = await ChatbotService.createChatSession(
      title: title,
      folderId: folderId,
      accessToken: _accessToken!,
      xrayImagePath: xrayImagePath,
    );
    
    setCurrentChatSession(chatSession);
    return chatSession;
  }
  
  // Clear session
  void clearSession() {
    _currentChatSessionId = null;
    _currentChatSession = null;
  }
}