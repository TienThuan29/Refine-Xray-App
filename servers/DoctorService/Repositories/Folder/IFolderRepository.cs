using DoctorService.Models;

namespace DoctorService.Repositories.Folder
{
    public interface IFolderRepository
    {
        Task<Models.Folder?> CreateFolderAsync(Models.Folder folder);
        Task<Models.Folder?> UpdatePatientProfileIdAsync(string folderId, string patientProfileId);
        Task<Models.Folder?> FindByIdAsync(string folderId);
        Task<List<Models.Folder>?> FindFoldersByCreatedByAsync(string createdBy);
    }
}

