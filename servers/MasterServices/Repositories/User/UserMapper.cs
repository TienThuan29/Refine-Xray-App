using Amazon.DynamoDBv2.Model;
using MasterServices.Models;

namespace MasterServices.Utils
{
    public static class DynamoMapper
    {
        public static Dictionary<string, AttributeValue> UserToDynamoItem(User user)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = user.Id },
                ["email"] = new AttributeValue { S = user.Email },
                ["password"] = new AttributeValue { S = user.Password },
                ["fullname"] = new AttributeValue { S = user.Fullname },
                ["role"] = new AttributeValue { S = user.Role.ToString() },
                ["isEnable"] = new AttributeValue { BOOL = user.IsEnable }
            };

            if (!string.IsNullOrEmpty(user.Phone))
                item["phone"] = new AttributeValue { S = user.Phone };

            if (user.DateOfBirth.HasValue)
                item["dateOfBirth"] = new AttributeValue { S = user.DateOfBirth.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            if (user.LastLoginDate.HasValue)
                item["lastLoginDate"] = new AttributeValue { S = user.LastLoginDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            if (user.CreatedDate.HasValue)
                item["createdDate"] = new AttributeValue { S = user.CreatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            if (user.UpdatedDate.HasValue)
                item["updatedDate"] = new AttributeValue { S = user.UpdatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

            return item;
        }

        public static User DynamoItemToUser(Dictionary<string, AttributeValue> item)
        {
            var user = new User
            {
                Id = item["id"].S,
                Email = item["email"].S,
                Password = item["password"].S,
                Fullname = item["fullname"].S,
                Role = Enum.Parse<Role>(item["role"].S),
                IsEnable = item["isEnable"].BOOL
            };

            if (item.ContainsKey("phone") && !string.IsNullOrEmpty(item["phone"].S))
                user.Phone = item["phone"].S;

            if (item.ContainsKey("dateOfBirth") && !string.IsNullOrEmpty(item["dateOfBirth"].S))
                user.DateOfBirth = DateTime.Parse(item["dateOfBirth"].S);

            if (item.ContainsKey("lastLoginDate") && !string.IsNullOrEmpty(item["lastLoginDate"].S))
                user.LastLoginDate = DateTime.Parse(item["lastLoginDate"].S);

            if (item.ContainsKey("createdDate") && !string.IsNullOrEmpty(item["createdDate"].S))
                user.CreatedDate = DateTime.Parse(item["createdDate"].S);

            if (item.ContainsKey("updatedDate") && !string.IsNullOrEmpty(item["updatedDate"].S))
                user.UpdatedDate = DateTime.Parse(item["updatedDate"].S);

            return user;
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
