import 'package:flutter/material.dart';
import '../../core/widgets/enhanced_button.dart';
import '../../core/widgets/background.dart';
import '../../core/widgets/text_field.dart';
import '../model/auth/register_request.dart';
import '../service/auth_service.dart';
import 'patient_home_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _repasswordController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();

  DateTime? _selectedDate;
  bool _obscurePassword = true;
  bool _obscureRepassword = true;
  int _currentStep = 0; // 0 for step 1, 1 for step 2
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
    _repasswordController.dispose();
    _fullNameController.dispose();
    _phoneController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(
        const Duration(days: 6570),
      ), // 18 years ago
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Colors.blue[700]!,
              onPrimary: Colors.white,
              surface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
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

  String? _validateConfirmPassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != _passwordController.text) {
      return 'Passwords do not match';
    }
    return null;
  }

  String? _validateFullName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your full name';
    }
    return null;
  }

  String? _validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your phone number';
    }
    if (value.length < 10) {
      return 'Please enter a valid phone number';
    }
    return null;
  }

  String? _validateDateOfBirth() {
    if (_selectedDate == null) {
      return 'Please select your date of birth';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width > 600;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // Background elements
          GradientBackground(),

          // Decorative elements
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

          // Main content
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
                    child: Column(
                      children: [
                        // Header
                        _buildCompactHeader(),
                        const SizedBox(height: 32),

                        // Progress Indicator
                        _buildProgressIndicator(),
                        const SizedBox(height: 32),

                        // Form Container
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              children: _currentStep == 0
                                  ? _buildStep1Form()
                                  : _buildStep2Form(),
                            ),
                          ),
                        ),
                      ],
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
          _currentStep == 0 ? 'Create Account' : 'Personal Information',
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
          _currentStep == 0
              ? 'Step 1 of 2 - Account Details'
              : 'Step 2 of 2 - Personal Details',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildProgressIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildProgressDot(0, _currentStep >= 0),
        Container(
          width: 40,
          height: 2,
          decoration: BoxDecoration(
            color: _currentStep >= 1 ? Colors.blue[400]! : Colors.grey[300],
            borderRadius: BorderRadius.circular(1),
          ),
        ),
        _buildProgressDot(1, _currentStep >= 1),
      ],
    );
  }

  Widget _buildProgressDot(int step, bool isActive) {
    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isActive ? Colors.blue[600]! : Colors.grey[300],
      ),
    );
  }

  List<Widget> _buildStep1Form() {
    return [
      // Form header
      Text(
        'Account Details',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.grey[800],
        ),
      ),
      Text(
        'Create your account',
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
        obscureText: _obscurePassword,
        suffixIcon: IconButton(
          icon: Icon(
            _obscurePassword
                ? Icons.visibility_off_rounded
                : Icons.visibility_rounded,
            color: Colors.blue[400],
            size: 20,
          ),
          onPressed: () {
            setState(() {
              _obscurePassword = !_obscurePassword;
            });
          },
        ),
        validator: _validatePassword,
      ),
      const SizedBox(height: 20),

      // Confirm Password field
      EnhancedTextField(
        controller: _repasswordController,
        label: 'Confirm Password',
        hint: 'Confirm your password',
        icon: Icons.lock_outlined,
        obscureText: _obscureRepassword,
        suffixIcon: IconButton(
          icon: Icon(
            _obscureRepassword
                ? Icons.visibility_off_rounded
                : Icons.visibility_rounded,
            color: Colors.blue[400],
            size: 20,
          ),
          onPressed: () {
            setState(() {
              _obscureRepassword = !_obscureRepassword;
            });
          },
        ),
        validator: _validateConfirmPassword,
      ),
      const SizedBox(height: 32),

      // Continue Button
      EnhancedButton(
        text: 'Continue',
        isLoading: _isLoading,
        onPressed: () {
          if (_formKey.currentState!.validate()) {
            _nextStep();
          }
        },
      ),
      const SizedBox(height: 16),

      // Login Link
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Already have an account? ',
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              'Login',
              style: TextStyle(
                color: Colors.blue[700],
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    ];
  }

  List<Widget> _buildStep2Form() {
    return [
      // Form header
      Text(
        'Personal Information',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.grey[800],
        ),
      ),
      Text(
        'Tell us about yourself',
        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
      ),
      const SizedBox(height: 24),

      // Full Name field
      EnhancedTextField(
        controller: _fullNameController,
        label: 'Full Name',
        hint: 'Enter your full name',
        icon: Icons.person_outline,
        validator: _validateFullName,
      ),
      const SizedBox(height: 20),

      // Phone field
      EnhancedTextField(
        controller: _phoneController,
        label: 'Phone Number',
        hint: 'Enter your phone number',
        icon: Icons.phone_outlined,
        keyboardType: TextInputType.phone,
        validator: _validatePhone,
      ),
      const SizedBox(height: 20),

      // Date of Birth field
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 6),
            child: Text(
              'Date of Birth',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
          ),
          GestureDetector(
            onTap: () => _selectDate(context),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _selectedDate == null
                      ? Colors.transparent
                      : Colors.blue[500]!,
                  width: _selectedDate == null ? 0 : 1.5,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.calendar_today_outlined,
                    color: Colors.blue[400],
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    _selectedDate == null
                        ? 'Select your date of birth'
                        : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
                    style: TextStyle(
                      fontSize: 15,
                      color: _selectedDate == null
                          ? Colors.grey[400]
                          : Colors.grey[800],
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_validateDateOfBirth() != null)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 4),
              child: Text(
                _validateDateOfBirth()!,
                style: TextStyle(color: Colors.red[400], fontSize: 12),
              ),
            ),
        ],
      ),
      const SizedBox(height: 32),

      // Back and Continue Buttons
      Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _previousStep,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.blue[700],
                side: BorderSide(color: Colors.blue[700]!),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'Back',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: EnhancedButton(
              text: 'Create Account',
              isLoading: _isLoading,
              onPressed: () {
                if (_validateDateOfBirth() == null &&
                    _formKey.currentState!.validate()) {
                  _handleRegistration();
                } else {
                  setState(() {}); // Trigger validation
                }
              },
            ),
          ),
        ],
      ),
    ];
  }

  void _nextStep() {
    setState(() {
      if (_currentStep < 1) {
        _currentStep++;
        _animationController.reset();
        _animationController.forward();
      }
    });
  }

  void _previousStep() {
    setState(() {
      if (_currentStep > 0) {
        _currentStep--;
        _animationController.reset();
        _animationController.forward();
      }
    });
  }

  void _handleRegistration() async {
    if (_formKey.currentState!.validate() && _validateDateOfBirth() == null) {
      setState(() {
        _isLoading = true;
      });

      try {
        final registerRequest = RegisterRequest(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          fullname: _fullNameController.text.trim(),
          phone: _phoneController.text.trim(),
          dateOfBirth: _selectedDate!.toIso8601String().split(
            'T',
          )[0], // Format as YYYY-MM-DD
        );

        final registerResponse = await AuthService.register(registerRequest);

        setState(() {
          _isLoading = false;
        });

        if (registerResponse.success && registerResponse.dataResponse != null) {
          final accessToken = registerResponse.dataResponse!.accessToken;
          final userProfile = registerResponse.dataResponse!.userProfile;

          if (mounted) {
            // Show success message
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle_outline, color: Colors.white),
                    const SizedBox(width: 8),
                    Expanded(
                      child: const Text('Account created successfully!'),
                    ),
                  ],
                ),
                behavior: SnackBarBehavior.floating,
                backgroundColor: Colors.green[600],
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                margin: const EdgeInsets.all(16),
              ),
            );

            // Navigate to home page (tokens are already saved by AuthService)
            Navigator.pushReplacement(
              context,
              PageRouteBuilder(
                pageBuilder: (context, animation, secondaryAnimation) =>
                    PatientHomePage(
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
            final errorMessage =
                registerResponse.error ?? registerResponse.message;
            _showErrorSnackBar(
              errorMessage.isNotEmpty ? errorMessage : 'Registration failed',
            );
          }
        }
      } catch (e) {
        setState(() {
          _isLoading = false;
        });

        if (mounted) {
          String errorMessage = 'Registration failed: ${e.toString()}';
          if (e.toString().contains('Email already exists')) {
            errorMessage = 'Email already exists';
          } else if (e.toString().contains('Network error')) {
            errorMessage = 'Network error. Please check your connection.';
          }
          _showErrorSnackBar(errorMessage);
        }
      }
    } else {
      setState(() {}); // Trigger validation
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
}
