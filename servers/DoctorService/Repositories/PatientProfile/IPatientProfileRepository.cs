namespace DoctorService.Repositories.PatientProfile
{
    public interface IPatientProfileRepository
    {
        Task<Models.PatientProfile?> CreatePatientProfileAsync(Models.PatientProfile patientProfile);
        Task<Models.PatientProfile?> FindByIdAsync(string patientProfileId);
    }
}

