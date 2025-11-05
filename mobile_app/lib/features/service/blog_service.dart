import '../model/blog/blog_list_response.dart';
import '../../core/network/api_network.dart';
import '../../core/config/api_config.dart';

class BlogService {
  // Get all blogs
  static Future<BlogListResponse> getAllBlogs() async {
    try {
      final response = await ApiNetwork.getWithoutAuth(
        endpoint: ApiConfig.blogsEndpoint,
      );

      return BlogListResponse.fromJson(response);
    } catch (e) {
      throw Exception('Failed to fetch blogs: $e');
    }
  }

  // Get blog by ID
  static Future<Map<String, dynamic>> getBlogById(String id) async {
    try {
      final response = await ApiNetwork.getWithoutAuth(
        endpoint: '${ApiConfig.blogsEndpoint}/$id',
      );

      return response;
    } catch (e) {
      throw Exception('Failed to fetch blog: $e');
    }
  }
}
