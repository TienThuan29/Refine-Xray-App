class PatientReport {
  final String id;
  final String? title;
  final String? content;
  final String? patientEmail;
  final bool isSent;
  final String? sentDate;
  final bool isRead;
  final String? sentById;
  final String? sentByFullname;

  PatientReport({
    required this.id,
    this.title,
    this.content,
    this.patientEmail,
    required this.isSent,
    this.sentDate,
    required this.isRead,
    this.sentById,
    this.sentByFullname,
  });

  factory PatientReport.fromJson(Map<String, dynamic> json) {
    return PatientReport(
      id: json['id'] ?? '',
      title: json['title'],
      content: json['content'],
      patientEmail: json['patientEmail'],
      isSent: json['isSent'] ?? false,
      sentDate: json['sentDate'],
      isRead: json['isRead'] ?? false,
      sentById: json['sentById'],
      sentByFullname: json['sentByFullname'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'patientEmail': patientEmail,
      'isSent': isSent,
      'sentDate': sentDate,
      'isRead': isRead,
      'sentById': sentById,
      'sentByFullname': sentByFullname,
    };
  }
}
