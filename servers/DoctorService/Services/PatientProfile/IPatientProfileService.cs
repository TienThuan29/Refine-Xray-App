namespace DoctorService.Services.PatientProfile
{
    public interface IPatientProfileService
    {
        Task<Models.PatientProfile?> CreatePatientProfileAsync(string folderId, Models.PatientProfile patientProfile);
        Task<Models.PatientProfile?> FindByIdAsync(string patientProfileId);
    }
}

