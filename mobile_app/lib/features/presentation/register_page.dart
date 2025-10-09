import 'package:flutter/material.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({Key? key}) : super(key: key);

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _repasswordController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  
  DateTime? _selectedDate;
  bool _obscurePassword = true;
  bool _obscureRepassword = true;
  int _currentStep = 0; // 0 for step 1, 1 for step 2, 2 for step 3

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _repasswordController.dispose();
    _fullNameController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 6570)), // 18 years ago
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Colors.orange,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFF8C42), // Orange
              Color(0xFFFFB366), // Light orange
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  // Header
                  Text(
                    _currentStep == 0 ? 'Create Account' : 
                    _currentStep == 1 ? 'Personal Information' : 'Verify OTP',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _currentStep == 0 ? 'Step 1 of 3 - Account Details' : 
                    _currentStep == 1 ? 'Step 2 of 3 - Personal Details' : 'Step 3 of 3 - Verify Email',
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Progress Indicator
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildProgressDot(0, _currentStep == 0),
                      Container(
                        width: 30,
                        height: 2,
                        color: _currentStep >= 1 ? Colors.white : Colors.white30,
                      ),
                      _buildProgressDot(1, _currentStep == 1),
                      Container(
                        width: 30,
                        height: 2,
                        color: _currentStep >= 2 ? Colors.white : Colors.white30,
                      ),
                      _buildProgressDot(2, _currentStep == 2),
                    ],
                  ),
                  const SizedBox(height: 40),
                  
                  // Form Container
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: _currentStep == 0 ? _buildStep1Form() : 
                                _currentStep == 1 ? _buildStep2Form() : _buildStep3Form(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  
                  // App Logo and Brand (in orange background)
                  Column(
                    children: [
                      // App Logo
                      Center(
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.medical_services,
                            color: Colors.orange,
                            size: 40,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      // App Title
                      const Center(
                        child: Text(
                          'Refine X-ray',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProgressDot(int step, bool isActive) {
    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isActive ? Colors.white : Colors.white30,
      ),
    );
  }

  List<Widget> _buildStep1Form() {
    return [
      // Email
      _buildTextField(
        controller: _emailController,
        label: 'Email',
        icon: Icons.email_outlined,
        keyboardType: TextInputType.emailAddress,
      ),
      const SizedBox(height: 20),
      
      // Password
      _buildTextField(
        controller: _passwordController,
        label: 'Password',
        icon: Icons.lock_outline,
        obscureText: _obscurePassword,
        suffixIcon: IconButton(
          icon: Icon(
            _obscurePassword ? Icons.visibility : Icons.visibility_off,
            color: Colors.orange,
          ),
          onPressed: () {
            setState(() {
              _obscurePassword = !_obscurePassword;
            });
          },
        ),
      ),
      const SizedBox(height: 20),
      
      // Re-enter Password
      _buildTextField(
        controller: _repasswordController,
        label: 'Confirm Password',
        icon: Icons.lock_outline,
        obscureText: _obscureRepassword,
        suffixIcon: IconButton(
          icon: Icon(
            _obscureRepassword ? Icons.visibility : Icons.visibility_off,
            color: Colors.orange,
          ),
          onPressed: () {
            setState(() {
              _obscureRepassword = !_obscureRepassword;
            });
          },
        ),
      ),
      const SizedBox(height: 32),
      
      // Continue Button
      SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              _nextStep();
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.orange,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 2,
          ),
          child: const Text(
            'Continue',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
      const SizedBox(height: 16),
      
      // Login Link
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            'Already have an account? ',
            style: TextStyle(color: Colors.grey),
          ),
          GestureDetector(
            onTap: () {
              Navigator.pop(context);
            },
            child: const Text(
              'Login',
              style: TextStyle(
                color: Colors.orange,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    ];
  }

  List<Widget> _buildStep2Form() {
    return [
      // Full Name
      _buildTextField(
        controller: _fullNameController,
        label: 'Full Name',
        icon: Icons.person_outline,
      ),
      const SizedBox(height: 20),
      
      // Phone
      _buildTextField(
        controller: _phoneController,
        label: 'Phone Number',
        icon: Icons.phone_outlined,
        keyboardType: TextInputType.phone,
      ),
      const SizedBox(height: 20),
      
      // Date of Birth
      GestureDetector(
        onTap: () => _selectDate(context),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.calendar_today_outlined, color: Colors.orange),
              const SizedBox(width: 12),
              Text(
                _selectedDate == null
                    ? 'Date of Birth'
                    : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
                style: TextStyle(
                  fontSize: 16,
                  color: _selectedDate == null ? Colors.grey.shade600 : Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 32),
      
      // Back and Continue Buttons
      Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _previousStep,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.orange,
                side: const BorderSide(color: Colors.orange),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'Back',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: () {
                if (_formKey.currentState!.validate()) {
                  _nextStep();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 2,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'Continue',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    ];
  }

  List<Widget> _buildStep3Form() {
    return [
      // OTP Description
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.orange.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange.shade200),
        ),
        child: Column(
          children: [
            const Icon(
              Icons.email_outlined,
              color: Colors.orange,
              size: 32,
            ),
            const SizedBox(height: 12),
            const Text(
              'We\'ve sent a verification code to',
              style: TextStyle(
                fontSize: 16,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _emailController.text,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.orange,
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 32),
      
      // OTP Input Field
      _buildTextField(
        controller: _otpController,
        label: 'Enter OTP Code',
        icon: Icons.security,
        keyboardType: TextInputType.number,
      ),
      const SizedBox(height: 24),
      
      // Resend OTP Link
      TextButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('OTP resent to your email'),
              backgroundColor: Colors.orange,
            ),
          );
        },
        child: Text(
          'Didn\'t receive code? Resend',
          style: TextStyle(color: Colors.orange, fontSize: 14),
        ),
      ),
      const SizedBox(height: 32),
      
      // Back and Verify Buttons
      Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _previousStep,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.orange,
                side: const BorderSide(color: Colors.orange),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'Back',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: () {
                if (_formKey.currentState!.validate()) {
                  _handleRegistration();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 2,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'Verify & Create Account',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    ];
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.orange),
        suffixIcon: suffixIcon,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.orange, width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        filled: true,
        fillColor: Colors.grey.shade50,
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please enter $label';
        }
        if (label == 'Email' && !value.contains('@')) {
          return 'Please enter a valid email';
        }
        if (label == 'Password' && value.length < 6) {
          return 'Password must be at least 6 characters';
        }
        if (label == 'Confirm Password') {
          if (value != _passwordController.text) {
            return 'Passwords do not match';
          }
        }
        if (label == 'Phone Number' && value.length < 10) {
          return 'Please enter a valid phone number';
        }
        if (label == 'Enter OTP Code' && value.length < 4) {
          return 'Please enter a valid OTP code';
        }
        return null;
      },
    );
  }

  void _nextStep() {
    setState(() {
      if (_currentStep < 2) {
        _currentStep++;
      }
    });
  }

  void _previousStep() {
    setState(() {
      if (_currentStep > 0) {
        _currentStep--;
      }
    });
  }

  void _handleRegistration() {
    // Implement your registration logic here
    print('Full Name: ${_fullNameController.text}');
    print('Email: ${_emailController.text}');
    print('Password: ${_passwordController.text}');
    print('Phone: ${_phoneController.text}');
    print('Date of Birth: $_selectedDate');
    print('OTP Code: ${_otpController.text}');
    
    // Show success message
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Account created and verified successfully!'),
        backgroundColor: Colors.orange,
      ),
    );
    
    // Navigate back to login or main page
    Navigator.pop(context);
  }
}