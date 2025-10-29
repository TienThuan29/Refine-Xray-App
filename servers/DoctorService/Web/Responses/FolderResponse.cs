namespace DoctorService.Web.Responses
{
    public class FolderResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? PatientProfileId { get; set; }
        public List<string>? ChatSessionIds { get; set; }
        public List<ChatSessionInfo>? ChatSessionsInfo { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }

    public class ChatSessionInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

