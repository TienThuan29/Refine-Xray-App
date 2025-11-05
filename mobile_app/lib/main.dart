import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'features/presentation/login_page.dart';
import 'features/presentation/forgot_password.dart';
import 'features/presentation/patient_home_page.dart';
import 'core/storage/token_storage.dart';
import 'features/service/auth_service.dart';
import 'features/model/auth/user_profile.dart';

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
      title: 'Medical Clini App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      // Start with initial page that checks for auto-login
      home: const InitialPage(),
      debugShowCheckedModeBanner: false,
      routes: {
        '/login': (context) => const LoginPage(),
        '/forgot-password': (context) => const ForgotPasswordPage(),
        // '/chat-bot': (context) => const ChatBotPage(),
      },
    );
  }
}

// Initial page that checks for existing tokens and auto-logs in
class InitialPage extends StatefulWidget {
  const InitialPage({super.key});

  @override
  State<InitialPage> createState() => _InitialPageState();
}

class _InitialPageState extends State<InitialPage> {
  @override
  void initState() {
    super.initState();
    _checkAutoLogin();
  }

  Future<void> _checkAutoLogin() async {
    try {
      // Check if tokens exist
      final isLoggedIn = await TokenStorage.isLoggedIn();

      if (isLoggedIn) {
        // Try to validate token by getting user profile
        final accessToken = await TokenStorage.getAccessToken();
        if (accessToken != null && accessToken.isNotEmpty) {
          try {
            final profileResponse = await AuthService.getUserProfile(
              accessToken,
            );

            // Check if response is successful (handle both lowercase and uppercase)
            final isSuccess =
                profileResponse['Success'] == true ||
                profileResponse['success'] == true;
            final dataResponse =
                profileResponse['DataResponse'] ??
                profileResponse['dataResponse'];

            if (isSuccess && dataResponse != null) {
              final userProfile = UserProfile.fromJson(dataResponse);

              if (mounted) {
                // Auto-login successful, navigate to home page
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PatientHomePage(
                      userProfile: userProfile,
                      accessToken: accessToken,
                    ),
                  ),
                );
                return;
              }
            }
          } catch (e) {
            // Token is invalid or expired, clear tokens and show login
            debugPrint('Token validation failed: $e');
            await TokenStorage.clearTokens();
          }
        }
      }

      // No valid tokens, show login page
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginPage()),
        );
      }
    } catch (e) {
      debugPrint('Error checking auto-login: $e');
      // On error, show login page
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginPage()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Show loading indicator while checking for tokens
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App logo
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Colors.blue[700]!, Colors.blue[400]!],
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.blue.withOpacity(0.3),
                    spreadRadius: 0,
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  Icons.medical_services_rounded,
                  color: Colors.white,
                  size: 56,
                ),
              ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              'Loading...',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }
}
