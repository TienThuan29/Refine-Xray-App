namespace PatientService.Repositories.PatientProfile
{
    public interface IPatientProfileRepository
    {
        Task<Models.PatientProfile?> CreatePatientProfileAsync(Models.PatientProfile patientProfile);
        Task<Models.PatientProfile?> FindByIdAsync(string patientProfileId);
        Task<List<Models.PatientProfile>> FindAllAsync();
        Task<Models.PatientProfile?> UpdatePatientProfileAsync(Models.PatientProfile patientProfile);
        Task<bool> DeletePatientProfileAsync(string patientProfileId);
    }
}
