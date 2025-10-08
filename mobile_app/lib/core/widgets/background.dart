import 'package:flutter/material.dart';

class GradientBackground extends StatelessWidget {
  final Widget ?child;

  const GradientBackground({Key? key, this.child}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.blue[100]!,  // Light blue
            Colors.blue[50]!,   // Very light blue
            Colors.white,       // White
          ],
          stops: const [0.0, 0.4, 1.0],
        ),
      ),
      child: child,
    );
  }
}