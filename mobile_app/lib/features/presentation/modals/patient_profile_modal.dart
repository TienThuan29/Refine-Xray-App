import 'package:flutter/material.dart';

class PatientProfileModal extends StatefulWidget {
  final Function(Map<String, dynamic>) onComplete;
  final Map<String, dynamic>? folderData;

  const PatientProfileModal({
    super.key,
    required this.onComplete,
    this.folderData,
  });

  @override
  State<PatientProfileModal> createState() => _PatientProfileModalState();
}

class _PatientProfileModalState extends State<PatientProfileModal> {
  final _formKey = GlobalKey<FormState>();
  final _ageController = TextEditingController();
  final _symptomsController = TextEditingController();
  final _medicalHistoryController = TextEditingController();
  
  String _selectedGender = 'male';
  String _selectedSpecialty = 'radiology';
  String _selectedUrgency = 'normal';
  bool _includeReferences = true;
  bool _isLoading = false;

  final List<Map<String, String>> _genderOptions = [
    {'value': 'male', 'label': 'Male'},
    {'value': 'female', 'label': 'Female'},
    {'value': 'other', 'label': 'Other'},
  ];

  final List<Map<String, String>> _specialtyOptions = [
    {'value': 'radiology', 'label': 'Radiology'},
    {'value': 'cardiology', 'label': 'Cardiology'},
    {'value': 'orthopedics', 'label': 'Orthopedics'},
    {'value': 'pulmonology', 'label': 'Pulmonology'},
    {'value': 'gastroenterology', 'label': 'Gastroenterology'},
    {'value': 'general', 'label': 'General Medicine'},
  ];

  final List<Map<String, String>> _urgencyOptions = [
    {'value': 'low', 'label': 'Low Priority'},
    {'value': 'normal', 'label': 'Normal'},
    {'value': 'high', 'label': 'High Priority'},
    {'value': 'urgent', 'label': 'Urgent'},
  ];

  @override
  void dispose() {
    _ageController.dispose();
    _symptomsController.dispose();
    _medicalHistoryController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final patientProfile = {
        'age': int.tryParse(_ageController.text.trim()),
        'gender': _selectedGender,
        'symptoms': _symptomsController.text.trim(),
        'medicalHistory': _medicalHistoryController.text.trim(),
        'specialty': _selectedSpecialty,
        'urgency': _selectedUrgency,
        'includeReferences': _includeReferences,
      };

      widget.onComplete({
        'patientProfile': patientProfile,
        'folderData': widget.folderData,
      });
      
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        constraints: const BoxConstraints(
          maxWidth: 500,
          maxHeight: 700,
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.person_outline,
                    color: Colors.blue[600],
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Patient Information',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                    iconSize: 20,
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Form Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Age and Gender Row
                      Row(
                        children: [
                          // Age Field
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Age',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextFormField(
                                  controller: _ageController,
                                  decoration: InputDecoration(
                                    hintText: 'Enter age',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    prefixIcon: const Icon(Icons.cake),
                                  ),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value != null && value.isNotEmpty) {
                                      final age = int.tryParse(value);
                                      if (age == null || age < 0 || age > 150) {
                                        return 'Please enter a valid age';
                                      }
                                    }
                                    return null;
                                  },
                                ),
                              ],
                            ),
                          ),
                          
                          const SizedBox(width: 16),
                          
                          // Gender Field
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Gender',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                DropdownButtonFormField<String>(
                                  value: _selectedGender,
                                  decoration: InputDecoration(
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    prefixIcon: const Icon(Icons.person),
                                  ),
                                  items: _genderOptions.map((option) {
                                    return DropdownMenuItem<String>(
                                      value: option['value']!,
                                      child: Text(option['label']!),
                                    );
                                  }).toList(),
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedGender = value!;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Specialty Field
                      const Text(
                        'Medical Specialty',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: _selectedSpecialty,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          prefixIcon: const Icon(Icons.medical_services),
                        ),
                        items: _specialtyOptions.map((option) {
                          return DropdownMenuItem<String>(
                            value: option['value']!,
                            child: Text(option['label']!),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedSpecialty = value!;
                          });
                        },
                      ),

                      const SizedBox(height: 20),

                      // Urgency Field
                      const Text(
                        'Priority Level',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: _selectedUrgency,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          prefixIcon: const Icon(Icons.priority_high),
                        ),
                        items: _urgencyOptions.map((option) {
                          return DropdownMenuItem<String>(
                            value: option['value']!,
                            child: Text(option['label']!),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedUrgency = value!;
                          });
                        },
                      ),

                      const SizedBox(height: 20),

                      // Symptoms Field
                      const Text(
                        'Symptoms (Optional)',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _symptomsController,
                        decoration: InputDecoration(
                          hintText: 'Describe current symptoms...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          prefixIcon: const Icon(Icons.sick),
                        ),
                        maxLines: 2,
                      ),

                      const SizedBox(height: 20),

                      // Medical History Field
                      const Text(
                        'Medical History (Optional)',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _medicalHistoryController,
                        decoration: InputDecoration(
                          hintText: 'Previous medical conditions, surgeries, etc...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          prefixIcon: const Icon(Icons.history),
                        ),
                        maxLines: 3,
                      ),

                      const SizedBox(height: 20),

                      // Include References Switch
                      SwitchListTile(
                        title: const Text(
                          'Include Medical References',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        subtitle: const Text(
                          'Include scientific references in the analysis',
                          style: TextStyle(fontSize: 14),
                        ),
                        value: _includeReferences,
                        onChanged: (value) {
                          setState(() {
                            _includeReferences = value;
                          });
                        },
                        activeColor: Colors.blue[600],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Footer Buttons
            Container(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[600],
                        foregroundColor: Colors.white,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text('Continue'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Show Patient Profile Modal Function
Future<void> showPatientProfileModal({
  required BuildContext context,
  required Function(Map<String, dynamic>) onComplete,
  Map<String, dynamic>? folderData,
}) {
  return showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => PatientProfileModal(
      onComplete: onComplete,
      folderData: folderData,
    ),
  );
}