namespace PatientService.Web.Responses
{
    public class PatientReportResponse
    {
        public string Id { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? PatientEmail { get; set; }
        public bool IsSent { get; set; }
        public DateTime? SentDate { get; set; }
        public bool IsRead { get; set; }
        public string? SentById { get; set; }
        public string? SentByFullname { get; set; }
    }
}

