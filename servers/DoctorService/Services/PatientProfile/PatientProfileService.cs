using DoctorService.Repositories.Folder;
using DoctorService.Repositories.PatientProfile;
using Microsoft.Extensions.Logging;

namespace DoctorService.Services.PatientProfile
{
    public class PatientProfileService : IPatientProfileService
    {
        private readonly IPatientProfileRepository _patientProfileRepository;
        private readonly IFolderRepository _folderRepository;
        private readonly ILogger<PatientProfileService> _logger;

        public PatientProfileService(
            IPatientProfileRepository patientProfileRepository,
            IFolderRepository folderRepository,
            ILogger<PatientProfileService> logger)
        {
            _patientProfileRepository = patientProfileRepository;
            _folderRepository = folderRepository;
            _logger = logger;
        }

        public async Task<Models.PatientProfile?> CreatePatientProfileAsync(string folderId, Models.PatientProfile patientProfile)
        {
            try
            {
                // Create the patient profile
                var savedPatientProfile = await _patientProfileRepository.CreatePatientProfileAsync(patientProfile);
                if (savedPatientProfile == null)
                {
                    _logger.LogError("Failed to create patient profile");
                    return null;
                }

                // Update the folder with the patient profile ID
                var updatedFolder = await _folderRepository.UpdatePatientProfileIdAsync(folderId, savedPatientProfile.Id);
                if (updatedFolder == null)
                {
                    _logger.LogError("Failed to update folder {FolderId} with patient profile ID {PatientProfileId}", folderId, savedPatientProfile.Id);
                    // Note: In a production environment, you might want to rollback the patient profile creation
                }

                _logger.LogInformation("Successfully created patient profile {PatientProfileId} and updated folder {FolderId}", savedPatientProfile.Id, folderId);
                return savedPatientProfile;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating patient profile for folder {folderId}");
                throw;
            }
        }

        public async Task<Models.PatientProfile?> FindByIdAsync(string patientProfileId)
        {
            try
            {
                return await _patientProfileRepository.FindByIdAsync(patientProfileId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error finding patient profile with ID: {patientProfileId}");
                throw;
            }
        }
    }
}

