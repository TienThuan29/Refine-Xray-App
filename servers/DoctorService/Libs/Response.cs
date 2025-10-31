using Microsoft.AspNetCore.Mvc;

namespace DoctorService.Libs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? DataResponse { get; set; }
        public string? Error { get; set; }
        public string? Stack { get; set; }
    }

    public class ResponseUtil
    {
        public static ActionResult<ApiResponse<T>> Success<T>(
            T dataResponse,
            string message = "Success",
            int statusCode = 200)
        {
            var response = new ApiResponse<T>
            {
                Success = true,
                Message = message,
                DataResponse = dataResponse
            };

            return new ObjectResult(response)
            {
                StatusCode = statusCode
            };
        }

        public static ActionResult<ApiResponse<T>> Error<T>(
            string message = "Internal Server Error",
            int statusCode = 500,
            string? error = null,
            string? stack = null)
        {
            var response = new ApiResponse<T>
            {
                Success = false,
                Message = message
            };

            if (!string.IsNullOrEmpty(error))
                response.Error = error;

            // Only include stack trace in development environment
            if (!string.IsNullOrEmpty(stack) && 
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                response.Stack = stack;
            }

            return new ObjectResult(response)
            {
                StatusCode = statusCode
            };
        }

        public static ActionResult<ApiResponse<object>> Validation(
            string message = "Validation Error",
            object? errors = null)
        {
            var response = new ApiResponse<object>
            {
                Success = false,
                Message = message,
                Error = errors?.ToString()
            };

            return new ObjectResult(response)
            {
                StatusCode = 400
            };
        }
    }
}

