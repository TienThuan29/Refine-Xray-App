using DoctorService.Models;
using DoctorService.Repositories.Folder;
using DoctorService.Web.Requests;
using DoctorService.Web.Responses;
using Microsoft.Extensions.Logging;

namespace DoctorService.Services.Folder
{
    public class FolderService : IFolderService
    {
        private readonly IFolderRepository _folderRepository;
        private readonly ILogger<FolderService> _logger;

        public FolderService(IFolderRepository folderRepository, ILogger<FolderService> logger)
        {
            _folderRepository = folderRepository;
            _logger = logger;
        }

        public async Task<Models.Folder?> CreateFolderAsync(FolderRequest folderRequest, string createdBy)
        {
            var folder = new Models.Folder
            {
                Title = folderRequest.Title,
                Description = folderRequest.Description,
                CreatedBy = createdBy,
                Type = folderRequest.Type
            };

            return await _folderRepository.CreateFolderAsync(folder);
        }

        public async Task<Models.Folder?> UpdatePatientProfileIdAsync(string folderId, string patientProfileId)
        {
            // Note: In the Node.js version, there's a patient service validation
            // For now, we'll implement the basic update. You may want to add patient validation later
            return await _folderRepository.UpdatePatientProfileIdAsync(folderId, patientProfileId);
        }

        public async Task<Models.Folder?> FindByIdAsync(string folderId)
        {
            return await _folderRepository.FindByIdAsync(folderId);
        }

        public async Task<List<FolderResponse>?> GetFolderOfUserAsync(string userId)
        {
            var folders = await _folderRepository.FindFoldersByCreatedByAsync(userId);
            if (folders == null)
            {
                return null;
            }

            // Map folders to folder responses
            var folderResponses = folders?.Select(folder => 
            {
                var response = new FolderResponse
                {
                    Id = folder.Id,
                    Title = folder.Title,
                    Description = folder.Description,
                    ChatSessionIds = folder.ChatSessionIds,
                    PatientProfileId = folder.PatientProfileId,
                    CreatedBy = folder.CreatedBy,
                    IsDeleted = folder.IsDeleted,
                    Type = folder.Type, // This will be ANALYZE for old folders without type field
                    CreatedDate = folder.CreatedDate,
                    UpdatedDate = folder.UpdatedDate,
                    ChatSessionsInfo = new List<ChatSessionInfo>() // TODO: Implement chat session info retrieval
                };
                
                // Log to verify Type is set
                _logger.LogInformation("Folder {FolderId} ({Title}): Type={Type}", response.Id, response.Title, response.Type);
                
                return response;
            }).ToList() ?? new List<FolderResponse>();

            return folderResponses;
        }

        public async Task<Models.Folder?> UpdateFolderAsync(string folderId, UpdateFolderRequest request)
        {
            return await _folderRepository.UpdateFolderAsync(folderId, request.Title, request.Description);
        }

        public async Task<bool> DeleteFolderAsync(string folderId)
        {
            return await _folderRepository.SoftDeleteFolderAsync(folderId);
        }
    }
}

