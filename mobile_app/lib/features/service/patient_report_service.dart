import '../model/patient_report/patient_report_list_response.dart';
import '../../core/network/api_network.dart';
import '../../core/config/api_config.dart';

class PatientReportService {
  // Get all patient reports by email
  static Future<PatientReportListResponse> getPatientReportsByEmail({
    required String email,
    required String token,
  }) async {
    try {
      final encodedEmail = Uri.encodeComponent(email);
      final response = await ApiNetwork.getWithAuth(
        endpoint: '${ApiConfig.patientReportsEndpoint}/patient/$encodedEmail',
        token: token,
      );

      return PatientReportListResponse.fromJson(response);
    } catch (e) {
      throw Exception('Failed to fetch patient reports: $e');
    }
  }

  // Mark report as read
  static Future<Map<String, dynamic>> markReportAsRead({
    required String reportId,
    required String token,
  }) async {
    try {
      final response = await ApiNetwork.putWithAuth(
        endpoint: '${ApiConfig.patientReportsEndpoint}/$reportId/mark-read',
        token: token,
        body: {},
      );

      return response;
    } catch (e) {
      throw Exception('Failed to mark report as read: $e');
    }
  }
}
