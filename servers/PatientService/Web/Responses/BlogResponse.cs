namespace PatientService.Web.Responses
{
    public class BlogResponse
    {
        public string Id { get; set; } = string.Empty;
        public string CreateBy { get; set; } = string.Empty;
        public string? CreateByFullname { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<string> ImageUrls { get; set; } = new List<string>();
        public string? Subtitle { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
    }
}

