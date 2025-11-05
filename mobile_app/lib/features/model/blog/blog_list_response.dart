import 'blog.dart';

class BlogListResponse {
  final bool success;
  final String message;
  final List<Blog>? dataResponse;
  final String? error;
  final String? stack;

  BlogListResponse({
    required this.success,
    required this.message,
    this.dataResponse,
    this.error,
    this.stack,
  });

  factory BlogListResponse.fromJson(Map<String, dynamic> json) {
    return BlogListResponse(
      success: json['success'] ?? json['Success'] ?? false,
      message: json['message'] ?? json['Message'] ?? '',
      dataResponse: json['dataResponse'] != null
          ? (json['dataResponse'] as List)
                .map((item) => Blog.fromJson(item as Map<String, dynamic>))
                .toList()
          : json['DataResponse'] != null
          ? (json['DataResponse'] as List)
                .map((item) => Blog.fromJson(item as Map<String, dynamic>))
                .toList()
          : null,
      error: json['error'] ?? json['Error'],
      stack: json['stack'] ?? json['Stack'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'dataResponse': dataResponse?.map((blog) => blog.toJson()).toList(),
      'error': error,
      'stack': stack,
    };
  }
}
