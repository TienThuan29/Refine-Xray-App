using DoctorService.Models;
using DoctorService.Web.Requests;
using DoctorService.Web.Responses;

namespace DoctorService.Services.Folder
{
    public interface IFolderService
    {
        Task<Models.Folder?> CreateFolderAsync(FolderRequest folderRequest, string createdBy);
        Task<Models.Folder?> UpdatePatientProfileIdAsync(string folderId, string patientProfileId);
        Task<Models.Folder?> FindByIdAsync(string folderId);
        Task<List<FolderResponse>?> GetFolderOfUserAsync(string userId);
        Task<Models.Folder?> UpdateFolderAsync(string folderId, UpdateFolderRequest request);
        Task<bool> DeleteFolderAsync(string folderId);
    }
}

