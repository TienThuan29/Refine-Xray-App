import 'package:flutter/material.dart';
import '../model/auth/login_request.dart';
import '../service/auth_service.dart';
import 'welcome_page.dart';
import '../../core/widgets/enhanced_button.dart';
import '../../core/widgets/background.dart';
import '../../core/widgets/text_field.dart';
import 'forgot_password_email.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      ),
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: const Interval(0.2, 0.8, curve: Curves.easeOut),
          ),
        );

    _animationController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your email';
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your password';
    }
    if (value.length < 5) {
      return 'Password must be at least 5 characters';
    }
    return null;
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      try {
        final loginRequest = LoginRequest(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );

        final loginResponse = await AuthService.login(loginRequest);

        setState(() {
          _isLoading = false;
        });

        if (loginResponse.success && loginResponse.dataResponse != null) {
          final accessToken = loginResponse.dataResponse!.accessToken;
          final userProfile = loginResponse.dataResponse!.userProfile;

          if (mounted) {
            Navigator.pushReplacement(
              context,
              PageRouteBuilder(
                pageBuilder: (context, animation, secondaryAnimation) =>
                    WelcomePage(
                      userProfile: userProfile,
                      accessToken: accessToken,
                    ),
                transitionsBuilder:
                    (context, animation, secondaryAnimation, child) {
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(1.0, 0.0),
                            end: Offset.zero,
                          ).animate(animation),
                          child: child,
                        ),
                      );
                    },
                transitionDuration: const Duration(milliseconds: 300),
              ),
            );
          }
        } else {
          if (mounted) {
            _showErrorSnackBar(loginResponse.message);
          }
        }
      } catch (e) {
        setState(() {
          _isLoading = false;
        });

        if (mounted) {
          _showErrorSnackBar('Login failed: ${e.toString()}');
        }
      }
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.red[600],
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width > 600;

    return Scaffold(
      // Enable resizing when keyboard appears
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // Background elements remain unchanged
          GradientBackground(),

          // Keep decorative elements
          Positioned(
            top: -size.height * 0.1,
            right: -size.width * 0.2,
            child: Container(
              width: size.width * 0.7,
              height: size.width * 0.7,
              decoration: BoxDecoration(
                color: Colors.blue[200]!.withOpacity(0.3),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -size.height * 0.05,
            left: -size.width * 0.1,
            child: Container(
              width: size.width * 0.5,
              height: size.width * 0.5,
              decoration: BoxDecoration(
                color: Colors.blue[100]!.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
            ),
          ),

          // Main content - now scrollable to handle keyboard
          SafeArea(
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: isTablet ? size.width * 0.15 : 24.0,
                  vertical: 20.0,
                ),
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child: SizedBox(
                      // This provides a minimum height, but allows scrolling when needed
                      height: size.height - 40,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Header
                          _buildCompactHeader(),

                          // Main login form
                          _buildEnhancedLoginForm(),

                          // Social login options
                          _buildFooter(),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
  return Column(
    children: [
      // Chỉ giữ divider từ _buildSocialLoginOptions
      Padding(
        padding: const EdgeInsets.only(top: 24.0),
        child: Row(
          children: [
            Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
            Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
          ],
        ),
      ),
      const SizedBox(height: 20),
    ],
  );
}

  Widget _buildCompactHeader() {
    return Column(
      children: [
        // Logo with animation
        TweenAnimationBuilder(
          tween: Tween<double>(begin: 0.8, end: 1.0),
          duration: const Duration(seconds: 1),
          curve: Curves.elasticOut,
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Hero(
                tag: 'app_logo',
                child: Container(
                  width: 85,
                  height: 85,
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
                      size: 46,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 16),

        // App title
        Text(
          'Refine X-ray',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),

        // Subtitle
        Text(
          'Advanced Medical Imaging Analysis',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildEnhancedLoginForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Form header
          Text(
            'Welcome Back',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          Text(
            'Sign in to continue',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),

          // Email field
          EnhancedTextField(
            controller: _emailController,
            label: 'Email',
            hint: 'Enter your email',
            icon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
            validator: _validateEmail,
          ),
          const SizedBox(height: 20),

          // Password field
          EnhancedTextField(
            controller: _passwordController,
            label: 'Password',
            hint: 'Enter your password',
            icon: Icons.lock_outlined,
            obscureText: !_isPasswordVisible,
            suffixIcon: IconButton(
              icon: Icon(
                _isPasswordVisible
                    ? Icons.visibility_off_rounded
                    : Icons.visibility_rounded,
                color: Colors.blue[400],
                size: 20,
              ),
              onPressed: () {
                setState(() {
                  _isPasswordVisible = !_isPasswordVisible;
                });
              },
            ),
            validator: _validatePassword,
          ),
          const SizedBox(height: 16),

          // Forgot password button
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  PageRouteBuilder(
                    pageBuilder: (context, animation, secondaryAnimation) =>
                        const ForgotPasswordEmailPage(),
                    transitionsBuilder:
                        (context, animation, secondaryAnimation, child) {
                          return FadeTransition(
                            opacity: animation,
                            child: SlideTransition(
                              position: Tween<Offset>(
                                begin: const Offset(0, 0.1),
                                end: Offset.zero,
                              ).animate(animation),
                              child: child,
                            ),
                          );
                        },
                    transitionDuration: const Duration(milliseconds: 300),
                  ),
                );
              },
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: const Size(50, 20),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                'Forgot Password?',
                style: TextStyle(
                  color: Colors.blue[700],
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Login button
          EnhancedButton(
            text: 'Sign In',
            isLoading: _isLoading,
            onPressed: _handleLogin,
          ),

          // Sign up option - moved here from _buildSocialLoginOptions()
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                "Don't have an account? ",
                style: TextStyle(color: Colors.grey[600], fontSize: 14),
              ),
              TextButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('Sign up functionality coming soon!'),
                      behavior: SnackBarBehavior.floating,
                      backgroundColor: Colors.blue[800],
                    ),
                  );
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Sign Up',
                  style: TextStyle(
                    color: Colors.blue[700],
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Widget _buildEnhancedTextField({
  //   required TextEditingController controller,
  //   required String label,
  //   required String hint,
  //   required IconData icon,
  //   TextInputType? keyboardType,
  //   bool obscureText = false,
  //   Widget? suffixIcon,
  //   String? Function(String?)? validator,
  // }) {
  //   return Column(
  //     crossAxisAlignment: CrossAxisAlignment.start,
  //     children: [
  //       Padding(
  //         padding: const EdgeInsets.only(left: 4, bottom: 6),
  //         child: Text(
  //           label,
  //           style: TextStyle(
  //             fontSize: 14,
  //             fontWeight: FontWeight.w600,
  //             color: Colors.grey[800],
  //           ),
  //         ),
  //       ),
  //       TextFormField(
  //         controller: controller,
  //         keyboardType: keyboardType,
  //         obscureText: obscureText,
  //         validator: validator,
  //         style: TextStyle(fontSize: 15, color: Colors.grey[800]),
  //         cursorColor: Colors.blue[600],
  //         // Add these properties to ensure field is editable and focusable
  //         enableInteractiveSelection: true,
  //         autofocus: false,
  //         decoration: InputDecoration(
  //           hintText: hint,
  //           hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
  //           prefixIcon: Padding(
  //             padding: const EdgeInsets.only(left: 12, right: 8),
  //             child: Icon(icon, color: Colors.blue[400], size: 20),
  //           ),
  //           prefixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
  //           suffixIcon: suffixIcon,
  //           filled: true,
  //           fillColor: Colors.grey[50],
  //           contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  //           border: OutlineInputBorder(
  //             borderRadius: BorderRadius.circular(16),
  //             borderSide: BorderSide.none,
  //           ),
  //           enabledBorder: OutlineInputBorder(
  //             borderRadius: BorderRadius.circular(16),
  //             borderSide: BorderSide.none,
  //           ),
  //           focusedBorder: OutlineInputBorder(
  //             borderRadius: BorderRadius.circular(16),
  //             borderSide: BorderSide(color: Colors.blue[500]!, width: 1.5),
  //           ),
  //           errorBorder: OutlineInputBorder(
  //             borderRadius: BorderRadius.circular(16),
  //             borderSide: BorderSide(color: Colors.red[400]!, width: 1.5),
  //           ),
  //           focusedErrorBorder: OutlineInputBorder(
  //             borderRadius: BorderRadius.circular(16),
  //             borderSide: BorderSide(color: Colors.red[400]!, width: 1.5),
  //           ),
  //         ),
  //       ),
  //     ],
  //   );
  // }

  // Widget _buildSocialLoginOptions() {
  //   return Column(
  //     children: [
  //       // Simple divider
  //       Row(
  //         children: [
  //           Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
  //           Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
  //         ],
  //       ),
  //       const SizedBox(height: 24),

  //       // Sign up option
  //       Row(
  //         mainAxisAlignment: MainAxisAlignment.center,
  //         children: [
  //           Text(
  //             "Don't have an account? ",
  //             style: TextStyle(color: Colors.grey[600], fontSize: 14),
  //           ),
  //           TextButton(
  //             onPressed: () {
  //               ScaffoldMessenger.of(context).showSnackBar(
  //                 SnackBar(
  //                   content: const Text('Sign up functionality coming soon!'),
  //                   behavior: SnackBarBehavior.floating,
  //                   backgroundColor: Colors.blue[800],
  //                 ),
  //               );
  //             },
  //             style: TextButton.styleFrom(
  //               padding: const EdgeInsets.symmetric(horizontal: 4),
  //               minimumSize: Size.zero,
  //               tapTargetSize: MaterialTapTargetSize.shrinkWrap,
  //             ),
  //             child: Text(
  //               'Sign Up',
  //               style: TextStyle(
  //                 color: Colors.blue[700],
  //                 fontSize: 14,
  //                 fontWeight: FontWeight.w700,
  //               ),
  //             ),
  //           ),
  //         ],
  //       ),
  //     ],
  //   );
  // }

}
