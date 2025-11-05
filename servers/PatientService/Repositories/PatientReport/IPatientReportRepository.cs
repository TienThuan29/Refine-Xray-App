namespace PatientService.Repositories.PatientReport
{
    public interface IPatientReportRepository
    {
        Task<Models.PatientReport?> CreatePatientReportAsync(Models.PatientReport report);
        Task<Models.PatientReport?> FindByIdAsync(string reportId);
        Task<List<Models.PatientReport>> FindByPatientEmailAsync(string patientEmail);
        Task<bool> DeletePatientReportAsync(string reportId);
        Task<Models.PatientReport?> UpdatePatientReportAsync(Models.PatientReport report);
    }
}

