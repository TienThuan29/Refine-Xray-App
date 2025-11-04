import 'package:flutter/material.dart';
import '../model/chat/chat_models.dart';
import '../service/chat_session_manager.dart';
import 'chat_bot.dart';

class ChatSessionListPage extends StatefulWidget {
  final String? accessToken;
  final String? folderId;

  const ChatSessionListPage({
    super.key,
    this.accessToken,
    this.folderId,
  });

  @override
  State<ChatSessionListPage> createState() => _ChatSessionListPageState();
}

class _ChatSessionListPageState extends State<ChatSessionListPage> {
  final TextEditingController _searchController = TextEditingController();
  final ChatSessionManager _chatSessionManager = ChatSessionManager();
  
  List<ChatSession> _chatSessions = [];
  List<ChatSession> _filteredSessions = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _initializeData() async {
    if (widget.accessToken != null) {
      _chatSessionManager.setAccessToken(widget.accessToken!);
    }
    await _loadChatSessions();
  }

  Future<void> _loadChatSessions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Load demo data for now (replace with real API call later)
      _loadDemoSessions();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _loadDemoSessions() {
    // Demo chat sessions
    setState(() {
      _chatSessions = [
        ChatSession(
          id: '1',
          title: 'Chest X-ray Analysis - Patient A',
          createdDate: DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
          chatItems: [
            ChatItem(
              id: '1',
              content: 'Please analyze this chest X-ray image.',
              isBot: false,
              createdDate: DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
              imageUrls: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'],
            ),
            ChatItem(
              id: '2',
              content: 'Based on the chest X-ray analysis:\n\n**Findings:**\n• Normal lung fields\n• No acute infiltrates\n• Heart size within normal limits\n• No pleural effusion\n\n**Impression:**\n• Normal chest X-ray\n• No acute cardiopulmonary process',
              isBot: true,
              createdDate: DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
              imageUrls: [],
            ),
          ],
        ),
        ChatSession(
          id: '2',
          title: 'Knee X-ray Consultation',
          createdDate: DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
          chatItems: [
            ChatItem(
              id: '3',
              content: 'I have knee pain, can you check my X-ray?',
              isBot: false,
              createdDate: DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
              imageUrls: [],
            ),
            ChatItem(
              id: '4',
              content: 'I can help analyze your knee X-ray. Please upload the image for detailed evaluation.',
              isBot: true,
              createdDate: DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
              imageUrls: [],
            ),
          ],
        ),
        ChatSession(
          id: '3',
          title: 'Spine MRI Review',
          createdDate: DateTime.now().subtract(const Duration(days: 7)).toIso8601String(),
          chatItems: [],
        ),
      ];
      _filteredSessions = List.from(_chatSessions);
      _isLoading = false;
    });
  }

  void _filterSessions(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredSessions = List.from(_chatSessions);
      } else {
        _filteredSessions = _chatSessions
            .where((session) =>
                session.title.toLowerCase().contains(query.toLowerCase()))
            .toList();
      }
    });
  }

  void _openChatSession(ChatSession session) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatBotPage(
          accessToken: widget.accessToken,
          chatSessionId: session.id,
          chatSessionTitle: session.title,
        ),
      ),
    );
  }

  void _createNewChat() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatBotPage(
          accessToken: widget.accessToken,
        ),
      ),
    );
  }

  String? _getLastMessage(ChatSession session) {
    if (session.chatItems == null || session.chatItems!.isEmpty) {
      return 'No messages yet';
    }
    return session.chatItems!.last.content;
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        return 'Today';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else {
        return '${(difference.inDays / 7).floor()} weeks ago';
      }
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Chat Sessions',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        foregroundColor: Colors.black87,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadChatSessions,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              onChanged: _filterSessions,
              decoration: InputDecoration(
                hintText: 'Search chat sessions...',
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.grey),
                        onPressed: () {
                          _searchController.clear();
                          _filterSessions('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey[100],
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),

          // Error State
          if (_error != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red[600]),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _error!,
                      style: TextStyle(color: Colors.red[600]),
                    ),
                  ),
                ],
              ),
            ),

          // Chat Sessions List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(),
                  )
                : _filteredSessions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.chat_bubble_outline,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No chat sessions found',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Start a new conversation with AI Doctor',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filteredSessions.length,
                        itemBuilder: (context, index) {
                          final session = _filteredSessions[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              title: Text(
                                session.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 8),
                                  Text(
                                    _getLastMessage(session) ?? 'No messages yet',
                                    style: TextStyle(
                                      color: Colors.grey[600],
                                      fontSize: 14,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.access_time,
                                        size: 14,
                                        color: Colors.grey[500],
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        _formatDate(session.createdDate),
                                        style: TextStyle(
                                          color: Colors.grey[500],
                                          fontSize: 12,
                                        ),
                                      ),
                                      const Spacer(),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.blue[50],
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          '${session.chatItems?.length ?? 0} messages',
                                          style: TextStyle(
                                            color: Colors.blue[600],
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              trailing: const Icon(
                                Icons.arrow_forward_ios,
                                size: 16,
                                color: Colors.grey,
                              ),
                              onTap: () => _openChatSession(session),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createNewChat,
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Chat'),
      ),
    );
  }
}