namespace PatientService.Services.PatientProfile
{
    public interface IPatientProfileService
    {
        Task<Models.PatientProfile?> CreatePatientProfileAsync(string folderId, Models.PatientProfile patientProfile);
        Task<Models.PatientProfile?> FindByIdAsync(string patientProfileId);
        Task<List<Models.PatientProfile>> FindAllAsync();
        Task<Models.PatientProfile?> UpdatePatientProfileAsync(Models.PatientProfile patientProfile);
        Task<bool> DeletePatientProfileAsync(string patientProfileId);
    }
}
