using Amazon.DynamoDBv2.Model;
using PatientService.Models;

namespace PatientService.Repositories.Blog
{
    public static class BlogDynamoMapper
    {
        public static Dictionary<string, AttributeValue> BlogToDynamoItem(Models.Blog blog)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = blog.Id },
                ["create_by"] = new AttributeValue { S = blog.CreateBy },
                ["title"] = new AttributeValue { S = blog.Title },
                ["content"] = new AttributeValue { S = blog.Content },
                ["is_deleted"] = new AttributeValue { BOOL = blog.IsDeleted },
                ["created_date"] = new AttributeValue { S = blog.CreatedDate.ToString("o") },
                ["updated_date"] = new AttributeValue { S = blog.UpdatedDate.ToString("o") }
            };

            if (!string.IsNullOrEmpty(blog.Subtitle))
                item["subtitle"] = new AttributeValue { S = blog.Subtitle };

            if (blog.ImageUrls != null && blog.ImageUrls.Count > 0)
            {
                item["image_urls"] = new AttributeValue
                {
                    L = blog.ImageUrls.Select(url => new AttributeValue { S = url }).ToList()
                };
            }

            return item;
        }

        public static Models.Blog DynamoItemToBlog(Dictionary<string, AttributeValue> item)
        {
            var blog = new Models.Blog
            {
                Id = item["id"].S,
                CreateBy = item["create_by"].S,
                Title = item["title"].S,
                Content = item["content"].S,
                IsDeleted = item.ContainsKey("is_deleted") && item["is_deleted"].BOOL,
                CreatedDate = DateTime.Parse(item["created_date"].S),
                UpdatedDate = DateTime.Parse(item["updated_date"].S)
            };

            if (item.ContainsKey("subtitle") && !string.IsNullOrEmpty(item["subtitle"].S))
                blog.Subtitle = item["subtitle"].S;

            if (item.ContainsKey("image_urls") && item["image_urls"].L != null)
            {
                blog.ImageUrls = item["image_urls"].L
                    .Select(av => av.S)
                    .ToList();
            }

            return blog;
        }
    }
}

