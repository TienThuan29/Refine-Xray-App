class ChatbotRequest {
  final String message;
  final String? action;
  final ChatbotContext? context;

  ChatbotRequest({
    required this.message,
    this.action,
    this.context,
  });

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      if (action != null) 'action': action,
      if (context != null) 'context': context!.toJson(),
    };
  }
}

class ChatbotContext {
  final String? specialty;
  final String? urgency;
  final bool? includeReferences;
  final int? age;
  final String? gender;
  final String? symptoms;
  final String? medicalHistory;

  ChatbotContext({
    this.specialty,
    this.urgency,
    this.includeReferences,
    this.age,
    this.gender,
    this.symptoms,
    this.medicalHistory,
  });

  Map<String, dynamic> toJson() {
    return {
      if (specialty != null) 'specialty': specialty,
      if (urgency != null) 'urgency': urgency,
      if (includeReferences != null) 'includeReferences': includeReferences,
      if (age != null) 'age': age,
      if (gender != null) 'gender': gender,
      if (symptoms != null) 'symptoms': symptoms,
      if (medicalHistory != null) 'medicalHistory': medicalHistory,
    };
  }
}

class ChatbotResponse {
  final String chatSessionId;
  final ChatItem userChatItem;
  final ChatItem botChatItem;
  final BotResponse botResponse;
  final String timestamp;

  ChatbotResponse({
    required this.chatSessionId,
    required this.userChatItem,
    required this.botChatItem,
    required this.botResponse,
    required this.timestamp,
  });

  factory ChatbotResponse.fromJson(Map<String, dynamic> json) {
    return ChatbotResponse(
      chatSessionId: json['chatSessionId'] ?? '',
      userChatItem: ChatItem.fromJson(json['userChatItem'] ?? {}),
      botChatItem: ChatItem.fromJson(json['botChatItem'] ?? {}),
      botResponse: BotResponse.fromJson(json['botResponse'] ?? {}),
      timestamp: json['timestamp'] ?? '',
    );
  }
}

class BotResponse {
  final String summarizeAnswer;
  final String fullAnswer;
  final String pubmedQueryUrl;
  final String pubmedFetchUrl;

  BotResponse({
    required this.summarizeAnswer,
    required this.fullAnswer,
    required this.pubmedQueryUrl,
    required this.pubmedFetchUrl,
  });

  factory BotResponse.fromJson(Map<String, dynamic> json) {
    return BotResponse(
      summarizeAnswer: json['summarize_answer'] ?? '',
      fullAnswer: json['full_answer'] ?? '',
      pubmedQueryUrl: json['pubmed_query_url'] ?? '',
      pubmedFetchUrl: json['pubmed_fetch_url'] ?? '',
    );
  }
}

class ChatItem {
  final String id;
  final String? title;
  final String content;
  final bool isBot;
  final List<String>? imageUrls;
  final String? createdDate;
  final String? updatedDate;
  final ChatItemMetaData? metaData;

  ChatItem({
    required this.id,
    this.title,
    required this.content,
    required this.isBot,
    this.imageUrls,
    this.createdDate,
    this.updatedDate,
    this.metaData,
  });

  factory ChatItem.fromJson(Map<String, dynamic> json) {
    return ChatItem(
      id: json['id'] ?? '',
      title: json['title'],
      content: json['content'] ?? '',
      isBot: json['isBot'] ?? false,
      imageUrls: json['imageUrls'] != null 
          ? List<String>.from(json['imageUrls'])
          : null,
      createdDate: json['createdDate'],
      updatedDate: json['updatedDate'],
      metaData: json['metaData'] != null 
          ? ChatItemMetaData.fromJson(json['metaData'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (title != null) 'title': title,
      'content': content,
      'isBot': isBot,
      if (imageUrls != null) 'imageUrls': imageUrls,
      if (createdDate != null) 'createdDate': createdDate,
      if (updatedDate != null) 'updatedDate': updatedDate,
      if (metaData != null) 'metaData': metaData!.toJson(),
    };
  }
}

class ChatItemMetaData {
  final String? pubmedQueryUrl;
  final String? pubmedFetchUrl;

  ChatItemMetaData({
    this.pubmedQueryUrl,
    this.pubmedFetchUrl,
  });

  factory ChatItemMetaData.fromJson(Map<String, dynamic> json) {
    return ChatItemMetaData(
      pubmedQueryUrl: json['pubmedQueryUrl'],
      pubmedFetchUrl: json['pubmedFetchUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (pubmedQueryUrl != null) 'pubmedQueryUrl': pubmedQueryUrl,
      if (pubmedFetchUrl != null) 'pubmedFetchUrl': pubmedFetchUrl,
    };
  }
}

class ChatSession {
  final String id;
  final String title;
  final List<ChatItem>? chatItems;
  final String? createdDate;
  final String? updatedDate;

  ChatSession({
    required this.id,
    required this.title,
    this.chatItems,
    this.createdDate,
    this.updatedDate,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      chatItems: json['chatItems'] != null
          ? (json['chatItems'] as List)
              .map((item) => ChatItem.fromJson(item))
              .toList()
          : null,
      createdDate: json['createdDate'],
      updatedDate: json['updatedDate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      if (chatItems != null)
        'chatItems': chatItems!.map((item) => item.toJson()).toList(),
      if (createdDate != null) 'createdDate': createdDate,
      if (updatedDate != null) 'updatedDate': updatedDate,
    };
  }
}