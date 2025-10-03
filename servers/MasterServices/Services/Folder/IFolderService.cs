using MasterServices.Models;
using MasterServices.Web.Requests;
using MasterServices.Web.Responses;

namespace MasterServices.Services.Folder
{
    public interface IFolderService
    {
        Task<Models.Folder?> CreateFolderAsync(FolderRequest folderRequest, string createdBy);
        Task<Models.Folder?> UpdatePatientProfileIdAsync(string folderId, string patientProfileId);
        Task<Models.Folder?> FindByIdAsync(string folderId);
        Task<List<FolderResponse>?> GetFolderOfUserAsync(string userId);
    }
}
