import 'package:flutter/material.dart';
import '../../model/chat/chat_models.dart';
import '../../service/chat_session_manager.dart';
import '../modals/new_chat_modal.dart';

class ChatSessionSidebar extends StatefulWidget {
  final String? accessToken;
  final String? currentSessionId;
  final Function(ChatSession) onSessionSelected;
  final Function() onNewChatCreated;

  const ChatSessionSidebar({
    super.key,
    this.accessToken,
    this.currentSessionId,
    required this.onSessionSelected,
    required this.onNewChatCreated,
  });

  @override
  State<ChatSessionSidebar> createState() => _ChatSessionSidebarState();
}

class _ChatSessionSidebarState extends State<ChatSessionSidebar> {
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
              content: 'Based on the chest X-ray analysis: Normal lung fields, no acute findings.',
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
              content: 'I can help analyze your knee X-ray. Please upload the image.',
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
        return '${difference.inDays}d ago';
      } else {
        return '${(difference.inDays / 7).floor()}w ago';
      }
    } catch (e) {
      return '';
    }
  }

  void _showNewChatModal() {
    showNewChatModal(
      context: context,
      accessToken: widget.accessToken,
      onCreateChat: (chatData) {
        // Create new session and select it
        final newSession = ChatSession(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: chatData['title'],
          createdDate: DateTime.now().toIso8601String(),
          chatItems: [],
        );
        
        setState(() {
          _chatSessions.insert(0, newSession);
          _filteredSessions = List.from(_chatSessions);
        });
        
        widget.onSessionSelected(newSession);
        widget.onNewChatCreated();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          right: BorderSide(color: Colors.grey[300]!),
        ),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Colors.grey[200]!),
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Text(
                      'Chat Sessions',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: _showNewChatModal,
                      icon: const Icon(Icons.add),
                      iconSize: 20,
                      padding: const EdgeInsets.all(4),
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _searchController,
                  onChanged: _filterSessions,
                  decoration: InputDecoration(
                    hintText: 'Search sessions...',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              _filterSessions('');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),

          // Error State
          if (_error != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red[600], size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: TextStyle(color: Colors.red[600], fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

          // Sessions List
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
                              size: 48,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No chat sessions',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Start a new conversation',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(8),
                        itemCount: _filteredSessions.length,
                        itemBuilder: (context, index) {
                          final session = _filteredSessions[index];
                          final isSelected = session.id == widget.currentSessionId;
                          
                          return Container(
                            margin: const EdgeInsets.only(bottom: 4),
                            child: Material(
                              color: isSelected ? Colors.blue[50] : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(8),
                                onTap: () => widget.onSessionSelected(session),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        session.title,
                                        style: TextStyle(
                                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                          fontSize: 14,
                                          color: isSelected ? Colors.blue[700] : Colors.black87,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        _getLastMessage(session) ?? 'No messages',
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 12,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.access_time,
                                            size: 12,
                                            color: Colors.grey[500],
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            _formatDate(session.createdDate),
                                            style: TextStyle(
                                              color: Colors.grey[500],
                                              fontSize: 11,
                                            ),
                                          ),
                                          const Spacer(),
                                          if (session.chatItems?.isNotEmpty ?? false)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: isSelected ? Colors.blue[100] : Colors.grey[100],
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                '${session.chatItems!.length}',
                                                style: TextStyle(
                                                  color: isSelected ? Colors.blue[700] : Colors.grey[600],
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),

          // New Chat Button
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: Colors.grey[200]!),
              ),
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _showNewChatModal,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('New Chat'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}