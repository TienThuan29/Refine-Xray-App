class RegisterRequest {
  final String email;
  final String password;
  final String fullname;
  final String phone;
  final String dateOfBirth;

  RegisterRequest({
    required this.email,
    required this.password,
    required this.fullname,
    required this.phone,
    required this.dateOfBirth,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
      'fullname': fullname,
      'phone': phone,
      'dateOfBirth': dateOfBirth,
    };
  }
}
