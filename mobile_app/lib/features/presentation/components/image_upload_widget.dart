import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class ImageUploadWidget extends StatefulWidget {
  final List<String> initialImages;
  final Function(List<String>) onImagesChanged;
  final bool enabled;

  const ImageUploadWidget({
    super.key,
    this.initialImages = const [],
    required this.onImagesChanged,
    this.enabled = true,
  });

  @override
  State<ImageUploadWidget> createState() => _ImageUploadWidgetState();
}

class _ImageUploadWidgetState extends State<ImageUploadWidget> {
  final ImagePicker _picker = ImagePicker();
  List<String> _imageUrls = [];

  @override
  void initState() {
    super.initState();
    _imageUrls = List.from(widget.initialImages);
  }

  Future<void> _pickImage() async {
    if (!widget.enabled) return;

    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );

      if (image != null) {
        setState(() {
          _imageUrls.add(image.path);
        });
        widget.onImagesChanged(_imageUrls);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error picking image: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _takePhoto() async {
    if (!widget.enabled) return;

    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );

      if (image != null) {
        setState(() {
          _imageUrls.add(image.path);
        });
        widget.onImagesChanged(_imageUrls);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error taking photo: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _removeImage(int index) {
    setState(() {
      _imageUrls.removeAt(index);
    });
    widget.onImagesChanged(_imageUrls);
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Add X-ray Image',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.blue),
              title: const Text('Choose from Gallery'),
              subtitle: const Text('Select an existing X-ray image'),
              onTap: () {
                Navigator.pop(context);
                _pickImage();
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.green),
              title: const Text('Take Photo'),
              subtitle: const Text('Capture a new X-ray image'),
              onTap: () {
                Navigator.pop(context);
                _takePhoto();
              },
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Upload Button
        if (widget.enabled)
          InkWell(
            onTap: _showImageSourceDialog,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.add_photo_alternate,
                    color: Colors.blue[600],
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Upload X-ray Image',
                    style: TextStyle(
                      color: Colors.blue[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Image Preview List
        if (_imageUrls.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _imageUrls.length,
              itemBuilder: (context, index) {
                final imageUrl = _imageUrls[index];
                return Container(
                  margin: const EdgeInsets.only(right: 12),
                  child: Stack(
                    children: [
                      // Image Preview
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: _buildImagePreview(imageUrl),
                      ),
                      
                      // Remove Button
                      if (widget.enabled)
                        Positioned(
                          top: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: () => _removeImage(index),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.close,
                                size: 16,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],

        // Info Text
        if (_imageUrls.isEmpty && widget.enabled)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Upload X-ray images for AI analysis',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildImagePreview(String imagePath) {
    // Check if it's a local file or network URL
    if (imagePath.startsWith('http')) {
      return Image.network(
        imagePath,
        width: 100,
        height: 120,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            width: 100,
            height: 120,
            color: Colors.grey[200],
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          return Container(
            width: 100,
            height: 120,
            color: Colors.grey[200],
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error, color: Colors.grey[400]),
                const SizedBox(height: 4),
                Text(
                  'Error loading image',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 10,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        },
      );
    } else {
      return Image.file(
        File(imagePath),
        width: 100,
        height: 120,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            width: 100,
            height: 120,
            color: Colors.grey[200],
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error, color: Colors.grey[400]),
                const SizedBox(height: 4),
                Text(
                  'Error loading image',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 10,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        },
      );
    }
  }
}