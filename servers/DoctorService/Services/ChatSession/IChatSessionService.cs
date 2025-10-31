using DoctorService.Web.Requests;
using DoctorService.Web.Responses;
using DoctorService.Libs;
using DoctorService.Models;

namespace DoctorService.Services.ChatSession
{
    public interface IChatSessionService
    {
        Task<ApiResponse<ChatSessionResponse>> AnalyzeAndCreateChatSessionAsync(ChatSessionRequest request);
        Task<ApiResponse<ChatSessionResponse>> CreateTextChatSessionAsync(CreateTextChatSessionRequest request);
        Task<ApiResponse<ChatSessionResponse>> GetChatSessionByIdAsync(string chatSessionId);
        Task<ApiResponse<ChatbotResponse>> SendChatMessageAsync(ChatbotRequest request);
        Task<ApiResponse<List<ChatSessionResponse>>> GetChatSessionsByFolderIdAsync(string folderId);
        Task<ApiResponse<bool>> DeleteChatSessionAsync(string chatSessionId);
        Task<GradcamAnalyses> TestGradCamProcessingAsync(GradcamAnalyses gradcamAnalyses, string chatSessionId);
        Task<ApiResponse<PubMedRAGResponse>> QueryPubMedRAGAsync(PubMedRAGRequest request);
    }
}

