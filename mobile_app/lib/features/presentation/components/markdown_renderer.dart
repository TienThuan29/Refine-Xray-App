import 'package:flutter/material.dart';

class MarkdownRenderer extends StatelessWidget {
  final String content;
  final TextStyle? style;
  final double fontSize;
  final Color? color;

  const MarkdownRenderer({
    super.key,
    required this.content,
    this.style,
    this.fontSize = 14,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return _buildMarkdownContent();
  }

  Widget _buildMarkdownContent() {
    // Simple markdown parser for basic formatting
    final lines = content.split('\n');
    final widgets = <Widget>[];

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      if (line.trim().isEmpty) {
        widgets.add(const SizedBox(height: 8));
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        widgets.add(_buildHeader(line.substring(4), 16, FontWeight.w600));
      } else if (line.startsWith('## ')) {
        widgets.add(_buildHeader(line.substring(3), 18, FontWeight.w700));
      } else if (line.startsWith('# ')) {
        widgets.add(_buildHeader(line.substring(2), 20, FontWeight.w800));
      }
      // Bold text with **
      else if (line.startsWith('**') && line.endsWith('**')) {
        widgets.add(_buildBoldText(line.substring(2, line.length - 2)));
      }
      // List items
      else if (line.startsWith('• ') || line.startsWith('- ')) {
        widgets.add(_buildListItem(line.substring(2)));
      }
      // Numbered list
      else if (RegExp(r'^\d+\. ').hasMatch(line)) {
        final match = RegExp(r'^\d+\. (.*)').firstMatch(line);
        if (match != null) {
          widgets.add(_buildListItem(match.group(1)!));
        }
      }
      // Code blocks
      else if (line.startsWith('```')) {
        // Find the end of code block
        int endIndex = i + 1;
        while (endIndex < lines.length && !lines[endIndex].startsWith('```')) {
          endIndex++;
        }
        if (endIndex < lines.length) {
          final codeLines = lines.sublist(i + 1, endIndex);
          widgets.add(_buildCodeBlock(codeLines.join('\n')));
          i = endIndex; // Skip to after the code block
        }
      }
      // Regular text with inline formatting
      else {
        widgets.add(_buildFormattedText(line));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  Widget _buildHeader(String text, double size, FontWeight weight) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        text,
        style: TextStyle(
          fontSize: size,
          fontWeight: weight,
          color: color ?? Colors.black87,
        ),
      ),
    );
  }

  Widget _buildBoldText(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Text(
        text,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          color: color ?? Colors.black87,
        ),
      ),
    );
  }

  Widget _buildListItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 8, right: 8),
            width: 4,
            height: 4,
            decoration: BoxDecoration(
              color: color ?? Colors.black54,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: _buildFormattedText(text),
          ),
        ],
      ),
    );
  }

  Widget _buildCodeBlock(String code) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Text(
        code,
        style: TextStyle(
          fontFamily: 'monospace',
          fontSize: fontSize - 1,
          color: Colors.black87,
        ),
      ),
    );
  }

  Widget _buildFormattedText(String text) {
    // Handle inline formatting like **bold** and *italic*
    final spans = <TextSpan>[];
    final RegExp boldPattern = RegExp(r'\*\*(.*?)\*\*');
    final RegExp italicPattern = RegExp(r'\*(.*?)\*');
    
    int lastIndex = 0;
    
    // Find bold text
    for (final match in boldPattern.allMatches(text)) {
      // Add text before bold
      if (match.start > lastIndex) {
        spans.add(TextSpan(
          text: text.substring(lastIndex, match.start),
          style: TextStyle(
            fontSize: fontSize,
            color: color ?? Colors.black87,
          ),
        ));
      }
      
      // Add bold text
      spans.add(TextSpan(
        text: match.group(1),
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          color: color ?? Colors.black87,
        ),
      ));
      
      lastIndex = match.end;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastIndex),
        style: TextStyle(
          fontSize: fontSize,
          color: color ?? Colors.black87,
        ),
      ));
    }
    
    // If no formatting found, return simple text
    if (spans.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Text(
          text,
          style: style ?? TextStyle(
            fontSize: fontSize,
            color: color ?? Colors.black87,
          ),
        ),
      );
    }
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: RichText(
        text: TextSpan(children: spans),
      ),
    );
  }
}