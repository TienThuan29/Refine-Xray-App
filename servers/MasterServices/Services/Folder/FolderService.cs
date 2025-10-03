using MasterServices.Models;
using MasterServices.Repositories.Folder;
using MasterServices.Web.Requests;
using MasterServices.Web.Responses;

namespace MasterServices.Services.Folder
{
    public class FolderService : IFolderService
    {
        private readonly IFolderRepository _folderRepository;

        public FolderService(IFolderRepository folderRepository)
        {
            _folderRepository = folderRepository;
        }

        public async Task<Models.Folder?> CreateFolderAsync(FolderRequest folderRequest, string createdBy)
        {
            var folder = new Models.Folder
            {
                Title = folderRequest.Title,
                Description = folderRequest.Description,
                CreatedBy = createdBy
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
            var folderResponses = folders?.Select(folder => new FolderResponse
            {
                Id = folder.Id,
                Title = folder.Title,
                Description = folder.Description,
                ChatSessionIds = folder.ChatSessionIds,
                PatientProfileId = folder.PatientProfileId,
                CreatedBy = folder.CreatedBy,
                IsDeleted = folder.IsDeleted,
                CreatedDate = folder.CreatedDate,
                UpdatedDate = folder.UpdatedDate,
                ChatSessionsInfo = new List<ChatSessionInfo>() // TODO: Implement chat session info retrieval
            }).ToList() ?? new List<FolderResponse>();

            return folderResponses;
        }
    }
}
