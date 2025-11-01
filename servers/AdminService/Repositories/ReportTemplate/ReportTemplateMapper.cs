using Amazon.DynamoDBv2.Model;
using AdminService.Models;

namespace AdminService.Repositories.ReportTemplate
{
    public static class ReportTemplateMapper
    {
        public static Dictionary<string, AttributeValue> ReportTemplateToDynamoItem(Models.ReportTemplate reportTemplate)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = reportTemplate.Id },
                ["template"] = new AttributeValue { S = reportTemplate.Template },
                ["fileLink"] = new AttributeValue { S = reportTemplate.FileLink },
                ["createBy"] = new AttributeValue { S = reportTemplate.CreateBy },
                ["isDeleted"] = new AttributeValue { BOOL = reportTemplate.IsDeleted }
            };

            if (reportTemplate.CreatedDate.HasValue)
                item["createdDate"] = new AttributeValue { S = reportTemplate.CreatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            if (reportTemplate.UpdatedDate.HasValue)
                item["updatedDate"] = new AttributeValue { S = reportTemplate.UpdatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            return item;
        }

        public static Models.ReportTemplate DynamoItemToReportTemplate(Dictionary<string, AttributeValue> item)
        {
            var reportTemplate = new Models.ReportTemplate
            {
                Id = item["id"].S,
                Template = item["template"].S,
                FileLink = item["fileLink"].S,
                CreateBy = item["createBy"].S,
                IsDeleted = item["isDeleted"].BOOL
            };

            if (item.ContainsKey("createdDate") && !string.IsNullOrEmpty(item["createdDate"].S))
                reportTemplate.CreatedDate = DateTime.Parse(item["createdDate"].S);

            if (item.ContainsKey("updatedDate") && !string.IsNullOrEmpty(item["updatedDate"].S))
                reportTemplate.UpdatedDate = DateTime.Parse(item["updatedDate"].S);

            return reportTemplate;
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

