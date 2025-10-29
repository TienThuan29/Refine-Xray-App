using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace IdentityService.Utils
{
    public static class HashingUtil
    {
        public static string HashString(string input, IConfiguration configuration)
        {
            var secretKey = configuration["HashingSecretKey"];
            if (string.IsNullOrEmpty(secretKey))
            {
                throw new InvalidOperationException("HASHING_SECRET_KEY is not configured");
            }

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        public static bool VerifyHash(string input, string hash, IConfiguration configuration)
        {
            var inputHash = HashString(input, configuration);
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(inputHash),
                Encoding.UTF8.GetBytes(hash)
            );
        }
    }
}

