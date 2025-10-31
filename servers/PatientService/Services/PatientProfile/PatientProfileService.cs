
using PatientService.Repositories.PatientProfile;
using Microsoft.Extensions.Logging;
using PatientService.Models;

namespace PatientService.Services.PatientProfile
{
    public class PatientProfileService : IPatientProfileService
    {
        private readonly IPatientProfileRepository _patientProfileRepository;
        // private readonly IFolderRepository _folderRepository;
        private readonly ILogger<PatientProfileService> _logger;

        public PatientProfileService(
            IPatientProfileRepository patientProfileRepository,
            // IFolderRepository folderRepository,
            ILogger<PatientProfileService> logger)
        {
            _patientProfileRepository = patientProfileRepository;
            // _folderRepository = folderRepository;
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
                _logger.LogInformation("Successfully created patient profile {PatientProfileId}", savedPatientProfile.Id);
                return savedPatientProfile;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating patient profile");
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

        public async Task<List<Models.PatientProfile>> FindAllAsync()
        {
            try
            {
                return await _patientProfileRepository.FindAllAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving patient profiles");
                throw;
            }
        }

        public async Task<Models.PatientProfile?> UpdatePatientProfileAsync(Models.PatientProfile patientProfile)
        {
            try
            {
                var updated = await _patientProfileRepository.UpdatePatientProfileAsync(patientProfile);
                if (updated == null)
                {
                    _logger.LogWarning("Attempted to update patient profile {PatientProfileId} but it was not found", patientProfile.Id);
                }
                else
                {
                    _logger.LogInformation("Updated patient profile {PatientProfileId}", patientProfile.Id);
                }

                return updated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient profile {PatientProfileId}", patientProfile.Id);
                throw;
            }
        }

        public async Task<bool> DeletePatientProfileAsync(string patientProfileId)
        {
            try
            {
                var deleted = await _patientProfileRepository.DeletePatientProfileAsync(patientProfileId);
                if (deleted)
                {
                    _logger.LogInformation("Deleted patient profile {PatientProfileId}", patientProfileId);
                }
                else
                {
                    _logger.LogWarning("Attempted to delete patient profile {PatientProfileId} but it was not found", patientProfileId);
                }

                return deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting patient profile {PatientProfileId}", patientProfileId);
                throw;
            }
        }
    }
}
