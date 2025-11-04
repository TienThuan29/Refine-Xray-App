namespace PatientService.Repositories.Blog
{
    public interface IBlogRepository
    {
        Task<Models.Blog?> CreateBlogAsync(Models.Blog blog);
        Task<Models.Blog?> FindByIdAsync(string blogId);
        Task<List<Models.Blog>> FindAllAsync();
        Task<Models.Blog?> UpdateBlogAsync(Models.Blog blog);
        Task<bool> DeleteBlogAsync(string blogId);
    }
}

