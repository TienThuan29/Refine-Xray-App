import 'package:flutter/material.dart';
import '../model/chat/chat_models.dart';
import '../service/chat_session_manager.dart';
import 'components/markdown_renderer.dart';
import 'components/image_upload_widget.dart';

class ChatBotPage extends StatefulWidget {
  final String? chatSessionTitle;
  final String? chatSessionId;
  final String? accessToken;

  const ChatBotPage({
    super.key,
    this.chatSessionTitle,
    this.chatSessionId,
    this.accessToken,
  });

  @override
  State<ChatBotPage> createState() => _ChatBotPageState();
}

class _ChatBotPageState extends State<ChatBotPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ChatSessionManager _chatSessionManager = ChatSessionManager();
  
  List<ChatItem> _messages = [];
  List<String> _imageUrls = [];
  bool _isSendingMessage = false;
  bool _isLoading = false;
  bool _isTyping = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeChatSession();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _initializeChatSession() async {
    if (widget.accessToken != null) {
      _chatSessionManager.setAccessToken(widget.accessToken!);
    }

    if (widget.chatSessionId != null) {
      _chatSessionManager.setCurrentChatSessionId(widget.chatSessionId!);
      await _loadChatSession();
    } else {
      _loadDemoMessages();
    }
  }

  Future<void> _loadChatSession() async {
    if (!_chatSessionManager.isReady) {
      _loadDemoMessages();
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final chatSession = await _chatSessionManager.refreshChatSession();
      setState(() {
        _messages = chatSession.chatItems ?? [];
        _isLoading = false;
      });
      _scrollToBottom();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
      _loadDemoMessages(); // Fallback to demo
    }
  }

  void _loadDemoMessages() {
    // Demo messages để test giao diện khi không có real API
    setState(() {
      _messages = [
        ChatItem(
          id: '1',
          content: 'Hello! I need help with my X-ray analysis.',
          isBot: false,
          createdDate: DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
          imageUrls: [],
        ),
        ChatItem(
          id: '2',
          content: 'Hello! I\'d be happy to help you analyze your X-ray. Please upload the X-ray image and I\'ll provide a detailed medical analysis including:\n\n• **Anatomical structures identification**\n• **Abnormality detection**\n• **Clinical recommendations**\n• **Follow-up suggestions**\n\nPlease note that this analysis is for educational purposes and should not replace professional medical consultation.',
          isBot: true,
          createdDate: DateTime.now().subtract(const Duration(minutes: 4)).toIso8601String(),
          imageUrls: [],
        ),
        ChatItem(
          id: '3',
          content: 'Here is my chest X-ray image. Can you help me understand what it shows?',
          isBot: false,
          createdDate: DateTime.now().subtract(const Duration(minutes: 2)).toIso8601String(),
          imageUrls: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'],
        ),
      ];
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _updateImageUrls(List<String> imageUrls) {
    setState(() {
      _imageUrls = imageUrls;
    });
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty) return;

    setState(() {
      _isSendingMessage = true;
      _isTyping = true;
    });

    // Add user message
    final userMessage = ChatItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: message,
      isBot: false,
      createdDate: DateTime.now().toIso8601String(),
      imageUrls: _imageUrls.toList(),
    );

    setState(() {
      _messages.add(userMessage);
      _messageController.clear();
      _imageUrls.clear();
    });

    _scrollToBottom();

    try {
      if (_chatSessionManager.isReady) {
        // Sử dụng real API
        final response = await _chatSessionManager.sendMessage(
          message,
        );

        setState(() {
          _isSendingMessage = false;
          _isTyping = false;
          _messages.add(response.botChatItem);
        });
      } else {
        // Fallback demo response
        await Future.delayed(const Duration(seconds: 2));
        
        final botMessage = ChatItem(
          id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
          content: _generateBotResponse(message),
          isBot: true,
          createdDate: DateTime.now().toIso8601String(),
          imageUrls: [],
        );

        setState(() {
          _isSendingMessage = false;
          _isTyping = false;
          _messages.add(botMessage);
        });
      }
    } catch (e) {
      setState(() {
        _isSendingMessage = false;
        _isTyping = false;
        _error = 'Failed to send message: ${e.toString()}';
      });
      
      // Hiển thị error message trong chat
      final errorMessage = ChatItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: 'Sorry, there was an error sending your message. Please try again.',
        isBot: true,
        createdDate: DateTime.now().toIso8601String(),
        imageUrls: [],
      );
      
      setState(() {
        _messages.add(errorMessage);
      });
    }

    _scrollToBottom();
  }

  String _generateBotResponse(String userMessage) {
    // Simple demo response based on user input
    if (userMessage.toLowerCase().contains('x-ray') || 
        userMessage.toLowerCase().contains('image') ||
        userMessage.toLowerCase().contains('scan')) {
      return 'Based on your X-ray related query, I can help with:\n\n**Initial Analysis:**\n• Review of anatomical structures\n• Detection of potential abnormalities\n• Clinical insights and recommendations\n\n**Recommendations:**\n• Please provide clear images for analysis\n• Consider clinical correlation with symptoms\n• Consult with qualified medical professionals\n\n*This analysis is for educational purposes and should not replace professional medical consultation.*';
    } else if (userMessage.toLowerCase().contains('help') || 
               userMessage.toLowerCase().contains('what')) {
      return 'I\'m here to help you with medical image analysis. I can:\n\n• **Analyze X-ray images**\n• **Identify anatomical structures**\n• **Detect potential abnormalities**\n• **Provide educational insights**\n• **Suggest follow-up questions**\n\nPlease share your medical images or ask specific questions about your scans.';
    } else {
      return 'Thank you for your message. I\'m an AI assistant specialized in medical image analysis. Please feel free to upload X-ray images or ask questions about medical imaging. I\'m here to help provide educational insights and analysis.';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          widget.chatSessionTitle ?? 'Chat with AI Doctor',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        foregroundColor: Colors.black87,
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {
              // Handle settings/options
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Error banner
          if (_error != null)
            Container(
              width: double.infinity,
              color: Colors.red[50],
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red[600], size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: TextStyle(color: Colors.red[600], fontSize: 14),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => setState(() => _error = null),
                  ),
                ],
              ),
            ),
          
          // Loading indicator
          if (_isLoading)
            const LinearProgressIndicator(),
          
          // Chat Messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isTyping) {
                  return _buildTypingIndicator();
                }
                return _buildMessageBubble(_messages[index]);
              },
            ),
          ),

          // Input Area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Column(
                children: [
                  // Image Upload Area
                  if (_imageUrls.isNotEmpty || !_isSendingMessage)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ImageUploadWidget(
                        initialImages: _imageUrls,
                        onImagesChanged: _updateImageUrls,
                        enabled: !_isSendingMessage,
                      ),
                    ),
                  
                  // Message Input Row
                  Row(
                    children: [
                      // Text input
                      Expanded(
                        child: TextField(
                          controller: _messageController,
                          decoration: InputDecoration(
                            hintText: 'Ask about the X-ray analysis...',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: BorderSide(color: Colors.blue[600]!),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                            filled: true,
                            fillColor: Colors.grey[50],
                          ),
                          maxLines: null,
                          onSubmitted: (_) => _sendMessage(),
                        ),
                      ),
                      
                      const SizedBox(width: 8),
                      
                      // Send button
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.blue[600],
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          onPressed: _isSendingMessage ? null : _sendMessage,
                          icon: _isSendingMessage
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : const Icon(
                                  Icons.send,
                                  color: Colors.white,
                                  size: 20,
                                ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatItem message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: 
            message.isBot ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (message.isBot) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.green[100],
              child: Icon(
                Icons.smart_toy,
                size: 18,
                color: Colors.green[600],
              ),
            ),
            const SizedBox(width: 8),
          ],
          
          Flexible(
            child: Column(
              crossAxisAlignment: message.isBot 
                  ? CrossAxisAlignment.start 
                  : CrossAxisAlignment.end,
              children: [
                Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: message.isBot 
                        ? Colors.grey[100] 
                        : Colors.blue[600],
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomLeft: message.isBot 
                          ? const Radius.circular(4) 
                          : const Radius.circular(16),
                      bottomRight: message.isBot 
                          ? const Radius.circular(16) 
                          : const Radius.circular(4),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Message content
                      if (message.isBot)
                        MarkdownRenderer(
                          content: message.content,
                          fontSize: 16,
                          color: Colors.grey[800],
                        )
                      else
                        Text(
                          message.content,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                          ),
                        ),
                      
                      // Images
                      if (message.imageUrls?.isNotEmpty ?? false) ...[
                        const SizedBox(height: 8),
                        ...message.imageUrls!.map((imageUrl) => 
                          Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                                loadingBuilder: (context, child, loadingProgress) {
                                  if (loadingProgress == null) return child;
                                  return Container(
                                    height: 200,
                                    decoration: BoxDecoration(
                                      color: Colors.grey[200],
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Center(
                                      child: CircularProgressIndicator(),
                                    ),
                                  );
                                },
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    height: 200,
                                    decoration: BoxDecoration(
                                      color: Colors.grey[200],
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Center(
                                      child: Icon(Icons.broken_image),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                
                // Timestamp
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    _formatTime(message.createdDate),
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          if (!message.isBot) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.blue[100],
              child: Icon(
                Icons.person,
                size: 18,
                color: Colors.blue[600],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: Colors.green[100],
            child: Icon(
              Icons.smart_toy,
              size: 18,
              color: Colors.green[600],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(16).copyWith(
                bottomLeft: const Radius.circular(4),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 40,
                  height: 20,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildTypingDot(0),
                      _buildTypingDot(1),
                      _buildTypingDot(2),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingDot(int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 600 + (index * 200)),
      builder: (context, value, child) {
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: Colors.grey[600]?.withOpacity(0.3 + (value * 0.7)),
            shape: BoxShape.circle,
          ),
        );
      },
    );
  }

  String _formatTime(String? createdDate) {
    if (createdDate == null) return '';
    
    try {
      final timestamp = DateTime.parse(createdDate);
      final now = DateTime.now();
      final difference = now.difference(timestamp);
      
      if (difference.inMinutes < 1) {
        return 'Just now';
      } else if (difference.inHours < 1) {
        return '${difference.inMinutes}m ago';
      } else if (difference.inDays < 1) {
        return '${difference.inHours}h ago';
      } else {
        return '${difference.inDays}d ago';
      }
    } catch (e) {
      return '';
    }
  }
}
