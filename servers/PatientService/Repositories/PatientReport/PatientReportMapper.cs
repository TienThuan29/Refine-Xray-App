using Amazon.DynamoDBv2.Model;
using PatientService.Models;

namespace PatientService.Repositories.PatientReport
{
    public static class PatientReportDynamoMapper
    {
        public static Dictionary<string, AttributeValue> PatientReportToDynamoItem(Models.PatientReport report)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = report.Id },
                ["is_sent"] = new AttributeValue { BOOL = report.IsSent },
                ["is_read"] = new AttributeValue { BOOL = report.IsRead }
            };

            if (!string.IsNullOrEmpty(report.Title))
                item["title"] = new AttributeValue { S = report.Title };

            if (!string.IsNullOrEmpty(report.Content))
                item["content"] = new AttributeValue { S = report.Content };

            if (!string.IsNullOrEmpty(report.PatientEmail))
                item["patient_email"] = new AttributeValue { S = report.PatientEmail };

            if (report.SentDate.HasValue)
                item["sent_date"] = new AttributeValue { S = report.SentDate.Value.ToString("o") };

            if (!string.IsNullOrEmpty(report.SentById))
                item["sent_by_id"] = new AttributeValue { S = report.SentById };

            if (!string.IsNullOrEmpty(report.SentByFullname))
                item["sent_by_fullname"] = new AttributeValue { S = report.SentByFullname };

            return item;
        }

        public static Models.PatientReport DynamoItemToPatientReport(Dictionary<string, AttributeValue> item)
        {
            var report = new Models.PatientReport
            {
                Id = item["id"].S,
                IsSent = item.ContainsKey("is_sent") && item["is_sent"].BOOL,
                IsRead = item.ContainsKey("is_read") && item["is_read"].BOOL
            };

            if (item.ContainsKey("title") && !string.IsNullOrEmpty(item["title"].S))
                report.Title = item["title"].S;

            if (item.ContainsKey("content") && !string.IsNullOrEmpty(item["content"].S))
                report.Content = item["content"].S;

            if (item.ContainsKey("patient_email") && !string.IsNullOrEmpty(item["patient_email"].S))
                report.PatientEmail = item["patient_email"].S;

            if (item.ContainsKey("sent_date") && !string.IsNullOrEmpty(item["sent_date"].S))
                report.SentDate = DateTime.Parse(item["sent_date"].S);

            if (item.ContainsKey("sent_by_id") && !string.IsNullOrEmpty(item["sent_by_id"].S))
                report.SentById = item["sent_by_id"].S;

            if (item.ContainsKey("sent_by_fullname") && !string.IsNullOrEmpty(item["sent_by_fullname"].S))
                report.SentByFullname = item["sent_by_fullname"].S;

            return report;
        }
    }
}

