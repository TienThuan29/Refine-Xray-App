using Amazon.DynamoDBv2.Model;
using DoctorService.Models;

namespace DoctorService.Repositories.Folder
{
    public static class DynamoMapper
    {
        // Folder mapping methods
        public static Dictionary<string, AttributeValue> FolderToDynamoItem(Models.Folder folder)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = folder.Id },
                ["title"] = new AttributeValue { S = folder.Title },
                ["type"] = new AttributeValue { S = folder.Type.ToString() },
                ["createdBy"] = new AttributeValue { S = folder.CreatedBy },
                ["isDeleted"] = new AttributeValue { BOOL = folder.IsDeleted }
            };

            if (!string.IsNullOrEmpty(folder.Description))
                item["description"] = new AttributeValue { S = folder.Description };

            if (!string.IsNullOrEmpty(folder.PatientProfileId))
                item["patientProfileId"] = new AttributeValue { S = folder.PatientProfileId };

            if (folder.ChatSessionIds != null && folder.ChatSessionIds.Any())
                item["chatSessionIds"] = new AttributeValue { SS = folder.ChatSessionIds };

            if (folder.CreatedDate.HasValue)
                item["createdDate"] = new AttributeValue { S = folder.CreatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            if (folder.UpdatedDate.HasValue)
                item["updatedDate"] = new AttributeValue { S = folder.UpdatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            return item;
        }

        public static Models.Folder DynamoItemToFolder(Dictionary<string, AttributeValue> item)
        {
            var folder = new Models.Folder
            {
                Id = item["id"].S,
                Title = item["title"].S,
                CreatedBy = item["createdBy"].S,
                Type = Enum.Parse<FolderType>(item["type"].S),
                IsDeleted = item["isDeleted"].BOOL
            };

            if (item.ContainsKey("description") && !string.IsNullOrEmpty(item["description"].S))
                folder.Description = item["description"].S;

            if (item.ContainsKey("patientProfileId") && !string.IsNullOrEmpty(item["patientProfileId"].S))
                folder.PatientProfileId = item["patientProfileId"].S;

            if (item.ContainsKey("chatSessionIds") && item["chatSessionIds"].SS != null)
                folder.ChatSessionIds = item["chatSessionIds"].SS;

            if (item.ContainsKey("createdDate") && !string.IsNullOrEmpty(item["createdDate"].S))
                folder.CreatedDate = DateTime.Parse(item["createdDate"].S);

            if (item.ContainsKey("updatedDate") && !string.IsNullOrEmpty(item["updatedDate"].S))
                folder.UpdatedDate = DateTime.Parse(item["updatedDate"].S);

            return folder;
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

