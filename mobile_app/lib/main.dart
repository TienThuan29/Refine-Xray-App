import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'features/presentation/login_page.dart';
import 'features/presentation/forgot_password.dart';
import 'features/presentation/chat_bot.dart';
import 'features/presentation/chat_session_list.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    // Load environment variables (optional)
    await dotenv.load(fileName: ".env");
    debugPrint('Environment loaded successfully');
    debugPrint('Base URL: ${dotenv.env['BASE_URL']}');
    debugPrint('Dotenv initialized: ${dotenv.isInitialized}');
  } catch (e) {
    debugPrint('Error loading .env file: $e');
    debugPrint('Continuing with dart-define or fallback values');
    // Continue with default values
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Refine X-ray App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const LoginPage(),
      debugShowCheckedModeBanner: false,
      routes: {
        '/login': (context) => const LoginPage(),
        '/forgot-password': (context) => const ForgotPasswordPage(),
        '/chat-bot': (context) => const ChatBotPage(),
        '/chat-sessions': (context) => const ChatSessionListPage(),
      },
    );
  }
}
