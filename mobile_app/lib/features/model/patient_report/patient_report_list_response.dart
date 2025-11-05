import 'patient_report.dart';

class PatientReportListResponse {
  final bool success;
  final String message;
  final List<PatientReport>? dataResponse;
  final String? error;

  PatientReportListResponse({
    required this.success,
    required this.message,
    this.dataResponse,
    this.error,
  });

  factory PatientReportListResponse.fromJson(Map<String, dynamic> json) {
    List<PatientReport>? reports;

    if (json['dataResponse'] != null) {
      if (json['dataResponse'] is List) {
        reports = (json['dataResponse'] as List)
            .map((item) => PatientReport.fromJson(item))
            .toList();
      }
    }

    return PatientReportListResponse(
      success: json['success'] ?? json['Success'] ?? false,
      message: json['message'] ?? json['Message'] ?? '',
      dataResponse: reports,
      error: json['error'] ?? json['Error'],
    );
  }
}
