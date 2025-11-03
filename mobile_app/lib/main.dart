import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'features/presentation/login_page.dart';
import 'features/presentation/patient_home_page.dart';
import 'features/model/auth/user_profile.dart';
import 'features/presentation/forgot_password.dart';
import 'features/presentation/chat_bot.dart';

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
    // Mock User Profile for testing (bypass login)
    final mockUserProfile = UserProfile(
      email: 'patient@example.com',
      fullname: 'Test Patient',
      phone: '0123456789',
      dateOfBirth: '1990-01-01',
      role: 'PATIENT',
      isEnable: true,
      createdDate: DateTime.now().toIso8601String(),
      updatedDate: DateTime.now().toIso8601String(),
    );

    const mockAccessToken = 'mock-access-token-for-testing';

    return MaterialApp(
      title: 'Refine X-ray App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      // Start directly with Patient Home Page (bypass login)
      home: PatientHomePage(
        userProfile: mockUserProfile,
        accessToken: mockAccessToken,
      ),
      // home: const LoginPage(),
      debugShowCheckedModeBanner: false,
      routes: {
        '/login': (context) => const LoginPage(),
        '/forgot-password': (context) => const ForgotPasswordPage(),
        '/chat-bot': (context) => const ChatBotPage(),
      },
    );
  }
}
