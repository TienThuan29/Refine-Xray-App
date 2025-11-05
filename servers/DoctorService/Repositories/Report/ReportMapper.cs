using Amazon.DynamoDBv2.Model;
using DoctorService.Models;

namespace DoctorService.Repositories.Report
{
    public static class ReportMapper
    {
        public static Dictionary<string, AttributeValue> ReportToDynamoItem(Models.Report report)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = report.Id },
                ["isSent"] = new AttributeValue { BOOL = report.IsSent }
            };

            if (!string.IsNullOrEmpty(report.Title))
                item["title"] = new AttributeValue { S = report.Title };

            if (!string.IsNullOrEmpty(report.TemplateId))
                item["templateId"] = new AttributeValue { S = report.TemplateId };

            if (!string.IsNullOrEmpty(report.Content))
                item["content"] = new AttributeValue { S = report.Content };

            if (!string.IsNullOrEmpty(report.ChatSessionId))
                item["chatSessionId"] = new AttributeValue { S = report.ChatSessionId };

            if (!string.IsNullOrEmpty(report.PatientEmail))
                item["patientEmail"] = new AttributeValue { S = report.PatientEmail };

            if (report.SentDate.HasValue)
                item["sentDate"] = new AttributeValue { S = report.SentDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            if (report.CreatedDate.HasValue)
                item["createdDate"] = new AttributeValue { S = report.CreatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            if (report.UpdatedDate.HasValue)
                item["updatedDate"] = new AttributeValue { S = report.UpdatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            return item;
        }

        public static Models.Report DynamoItemToReport(Dictionary<string, AttributeValue> item)
        {
            var report = new Models.Report
            {
                Id = item["id"].S,
                IsSent = item.ContainsKey("isSent") && item["isSent"].BOOL
            };

            if (item.ContainsKey("title") && !string.IsNullOrEmpty(item["title"].S))
                report.Title = item["title"].S;

            if (item.ContainsKey("templateId") && !string.IsNullOrEmpty(item["templateId"].S))
                report.TemplateId = item["templateId"].S;

            if (item.ContainsKey("content") && !string.IsNullOrEmpty(item["content"].S))
                report.Content = item["content"].S;

            if (item.ContainsKey("chatSessionId") && !string.IsNullOrEmpty(item["chatSessionId"].S))
                report.ChatSessionId = item["chatSessionId"].S;

            if (item.ContainsKey("patientEmail") && !string.IsNullOrEmpty(item["patientEmail"].S))
                report.PatientEmail = item["patientEmail"].S;

            if (item.ContainsKey("sentDate") && !string.IsNullOrEmpty(item["sentDate"].S))
                report.SentDate = DateTime.Parse(item["sentDate"].S);

            if (item.ContainsKey("createdDate") && !string.IsNullOrEmpty(item["createdDate"].S))
                report.CreatedDate = DateTime.Parse(item["createdDate"].S);

            if (item.ContainsKey("updatedDate") && !string.IsNullOrEmpty(item["updatedDate"].S))
                report.UpdatedDate = DateTime.Parse(item["updatedDate"].S);

            return report;
        }

        public static Dictionary<string, AttributeValue> CreateKey(string id)
        {
            return new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = id }
            };
        }
    }
}
