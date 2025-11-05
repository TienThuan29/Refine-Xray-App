import 'package:flutter/material.dart';
import '../model/blog/blog.dart';
import '../service/blog_service.dart';

class BlogPage extends StatefulWidget {
  final String? accessToken;

  const BlogPage({super.key, this.accessToken});

  @override
  State<BlogPage> createState() => _BlogPageState();
}

class _BlogPageState extends State<BlogPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();

  bool _isLoading = false;
  String? _error;
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'X-Ray Analysis',
    'Medical Tips',
    'Technology',
    'Health',
    'Research',
  ];

  // Blog posts from API
  List<BlogPost> _blogPosts = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _categories.length, vsync: this);
    _loadBlogPosts();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadBlogPosts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await BlogService.getAllBlogs();

      if (response.success && response.dataResponse != null) {
        setState(() {
          _blogPosts = response.dataResponse!
              .where((blog) => !blog.isDeleted) // Filter out deleted blogs
              .map((blog) => _mapBlogToBlogPost(blog))
              .toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = response.error ?? response.message;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load blogs: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  BlogPost _mapBlogToBlogPost(Blog blog) {
    // Parse date
    DateTime publishedDate;
    try {
      publishedDate = DateTime.parse(blog.createdDate);
    } catch (e) {
      publishedDate = DateTime.now();
    }

    // Extract excerpt from content (first 150 characters)
    String excerpt = blog.subtitle ?? blog.content;
    if (excerpt.length > 150) {
      excerpt = '${excerpt.substring(0, 150)}...';
    }

    // Get first image or use default
    String? imageUrl = blog.imageUrls.isNotEmpty ? blog.imageUrls.first : null;

    // Estimate read time (average reading speed: 200 words per minute)
    int wordCount = blog.content.split(RegExp(r'\s+')).length;
    int readTime = (wordCount / 200).ceil();
    if (readTime < 1) readTime = 1;

    // Extract category from title or use default
    String category = 'Medical Tips';
    if (blog.title.toLowerCase().contains('x-ray') ||
        blog.title.toLowerCase().contains('xray') ||
        blog.content.toLowerCase().contains('x-ray')) {
      category = 'X-Ray Analysis';
    } else if (blog.title.toLowerCase().contains('ai') ||
        blog.title.toLowerCase().contains('technology') ||
        blog.title.toLowerCase().contains('digital')) {
      category = 'Technology';
    } else if (blog.title.toLowerCase().contains('health') ||
        blog.title.toLowerCase().contains('wellness')) {
      category = 'Health';
    } else if (blog.title.toLowerCase().contains('research') ||
        blog.title.toLowerCase().contains('study')) {
      category = 'Research';
    }

    return BlogPost(
      id: blog.id,
      title: blog.title,
      excerpt: excerpt,
      content: blog.content, // Store full content
      category: category,
      author:
          blog.createByFullname ??
          (blog.createBy.contains('@')
              ? blog.createBy.split('@').first
              : 'Unknown Author'), // Use fullname, or email prefix, or default
      authorAvatar: 'https://i.pravatar.cc/150?img=${blog.id.hashCode % 10}',
      publishedDate: publishedDate,
      imageUrl: imageUrl,
      readTime: readTime,
      likes: 0, // API doesn't provide likes, default to 0
      isBookmarked: false,
    );
  }

  List<BlogPost> get _filteredPosts {
    if (_selectedCategory == 'All') {
      return _blogPosts;
    }
    return _blogPosts
        .where((post) => post.category == _selectedCategory)
        .toList();
  }

  void _toggleBookmark(BlogPost post) {
    setState(() {
      post.isBookmarked = !post.isBookmarked;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          post.isBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks',
        ),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Medical Blog',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        foregroundColor: Colors.black87,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // Implement search functionality
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Search functionality coming soon!'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.bookmarks),
            onPressed: () {
              // Show bookmarked posts
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => BookmarkedPostsPage(
                    posts: _blogPosts.where((p) => p.isBookmarked).toList(),
                  ),
                ),
              );
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: Colors.blue[700],
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: Colors.blue[700],
              indicatorWeight: 3,
              onTap: (index) {
                setState(() {
                  _selectedCategory = _categories[index];
                });
              },
              tabs: _categories.map((category) {
                return Tab(text: category);
              }).toList(),
            ),
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
            const SizedBox(height: 16),
            Text(
              'Error loading blog posts',
              style: TextStyle(fontSize: 18, color: Colors.grey[700]),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadBlogPosts,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[600],
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    }

    final filteredPosts = _filteredPosts;

    if (filteredPosts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.article_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No posts found',
              style: TextStyle(fontSize: 18, color: Colors.grey[700]),
            ),
            const SizedBox(height: 8),
            Text(
              'Try selecting a different category',
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadBlogPosts,
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: filteredPosts.length,
        itemBuilder: (context, index) {
          return _buildBlogCard(filteredPosts[index]);
        },
      ),
    );
  }

  Widget _buildBlogCard(BlogPost post) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => BlogDetailPage(post: post)),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Blog Image
            if (post.imageUrl != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
                child: Image.network(
                  post.imageUrl!,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 200,
                      color: Colors.grey[200],
                      child: const Center(
                        child: Icon(Icons.broken_image, size: 64),
                      ),
                    );
                  },
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      post.category,
                      style: TextStyle(
                        color: Colors.blue[700],
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Title
                  Text(
                    post.title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Excerpt
                  Text(
                    post.excerpt,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      height: 1.5,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 16),

                  // Author info and metadata
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundImage: NetworkImage(post.authorAvatar),
                        backgroundColor: Colors.grey[200],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              post.author,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${_formatDate(post.publishedDate)} • ${post.readTime} min read',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          Icon(
                            Icons.favorite_border,
                            size: 18,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${post.likes}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(width: 16),
                          IconButton(
                            icon: Icon(
                              post.isBookmarked
                                  ? Icons.bookmark
                                  : Icons.bookmark_border,
                              size: 20,
                              color: post.isBookmarked
                                  ? Colors.blue[700]
                                  : Colors.grey[600],
                            ),
                            onPressed: () => _toggleBookmark(post),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

// Blog Post Model
class BlogPost {
  final String id;
  final String title;
  final String excerpt;
  final String content; // Full content for detail view
  final String category;
  final String author;
  final String authorAvatar;
  final DateTime publishedDate;
  final String? imageUrl;
  final int readTime;
  final int likes;
  bool isBookmarked;

  BlogPost({
    required this.id,
    required this.title,
    required this.excerpt,
    required this.content,
    required this.category,
    required this.author,
    required this.authorAvatar,
    required this.publishedDate,
    this.imageUrl,
    required this.readTime,
    required this.likes,
    this.isBookmarked = false,
  });
}

// Blog Detail Page
class BlogDetailPage extends StatelessWidget {
  final BlogPost post;

  const BlogDetailPage({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: Colors.blue[700],
            flexibleSpace: FlexibleSpaceBar(
              background: post.imageUrl != null
                  ? Image.network(post.imageUrl!, fit: BoxFit.cover)
                  : Container(color: Colors.grey[300]),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      post.category,
                      style: TextStyle(
                        color: Colors.blue[700],
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    post.title,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Author info
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundImage: NetworkImage(post.authorAvatar),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              post.author,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${post.publishedDate.day}/${post.publishedDate.month}/${post.publishedDate.year} • ${post.readTime} min read',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Content
                  Text(
                    post.content,
                    style: const TextStyle(
                      fontSize: 16,
                      height: 1.8,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Bookmarked Posts Page
class BookmarkedPostsPage extends StatelessWidget {
  final List<BlogPost> posts;

  const BookmarkedPostsPage({super.key, required this.posts});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookmarked Posts'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 1,
      ),
      body: posts.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.bookmark_border,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No bookmarked posts',
                    style: TextStyle(fontSize: 18, color: Colors.grey[700]),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: posts.length,
              itemBuilder: (context, index) {
                final post = posts[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: ListTile(
                    leading: post.imageUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              post.imageUrl!,
                              width: 60,
                              height: 60,
                              fit: BoxFit.cover,
                            ),
                          )
                        : null,
                    title: Text(post.title),
                    subtitle: Text(post.author),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => BlogDetailPage(post: post),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
    );
  }
}
