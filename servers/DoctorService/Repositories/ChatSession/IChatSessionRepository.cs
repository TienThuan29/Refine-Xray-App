namespace DoctorService.Repositories.ChatSession
{
    public interface IChatSessionRepository
    {
        Task<DoctorService.Models.ChatSession?> CreateChatSessionAsync(DoctorService.Models.ChatSession chatSession);
        Task<DoctorService.Models.ChatSession?> GetByIdAsync(string chatSessionId);
        Task<DoctorService.Models.ChatSession?> UpdateChatSessionAsync(string chatSessionId, DoctorService.Models.ChatSession updates);
        Task<bool> DeleteChatSessionAsync(string chatSessionId);
        Task<List<DoctorService.Models.ChatSession>> GetByFolderIdAsync(string folderId);
    }
}
