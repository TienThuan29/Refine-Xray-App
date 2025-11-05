class Blog {
  final String id;
  final String createBy;
  final String? createByFullname;
  final String title;
  final List<String> imageUrls;
  final String? subtitle;
  final String content;
  final bool isDeleted;
  final String createdDate;
  final String updatedDate;

  Blog({
    required this.id,
    required this.createBy,
    this.createByFullname,
    required this.title,
    required this.imageUrls,
    this.subtitle,
    required this.content,
    required this.isDeleted,
    required this.createdDate,
    required this.updatedDate,
  });

  factory Blog.fromJson(Map<String, dynamic> json) {
    return Blog(
      id: json['id'] ?? '',
      createBy: json['createBy'] ?? json['create_by'] ?? '',
      createByFullname: json['createByFullname'],
      title: json['title'] ?? '',
      imageUrls: json['imageUrls'] != null
          ? List<String>.from(json['imageUrls'])
          : json['image_urls'] != null
          ? List<String>.from(json['image_urls'])
          : [],
      subtitle: json['subtitle'],
      content: json['content'] ?? '',
      isDeleted: json['isDeleted'] ?? json['is_deleted'] ?? false,
      createdDate: json['createdDate'] ?? json['created_date'] ?? '',
      updatedDate: json['updatedDate'] ?? json['updated_date'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createBy': createBy,
      'createByFullname': createByFullname,
      'title': title,
      'imageUrls': imageUrls,
      'subtitle': subtitle,
      'content': content,
      'isDeleted': isDeleted,
      'createdDate': createdDate,
      'updatedDate': updatedDate,
    };
  }
}
