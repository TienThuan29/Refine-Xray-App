using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MasterServices.Utils
{
    public class JwtUtil
    {
        private readonly IConfiguration _configuration;
        private readonly string _secret;
        private readonly string _accessTokenExpiration;
        private readonly string _refreshTokenExpiration;

        public JwtUtil(IConfiguration configuration)
        {
            _configuration = configuration;
            _secret = configuration["Jwt:JwtSecret"] ?? throw new InvalidOperationException("JWT_SECRET is not configured");
            _accessTokenExpiration = configuration["Jwt:JwtAccessTokenExpiration"] ?? "1d";
            _refreshTokenExpiration = configuration["Jwt:JwtRefreshTokenExpiration"] ?? "7d";
        }

        public string GenerateAccessToken(JwtPayload payload)
        {
            return GenerateToken(payload, _accessTokenExpiration);
        }

        public string GenerateRefreshToken(JwtPayload payload)
        {
            return GenerateToken(payload, _refreshTokenExpiration);
        }

        public async Task<JwtPayload> VerifyAsync(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_secret);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = await tokenHandler.ValidateTokenAsync(token, validationParameters);
                var jwtToken = (JwtSecurityToken)principal.SecurityToken;

                return new JwtPayload
                {
                    Id = jwtToken.Claims.First(x => x.Type == "id").Value,
                    Email = jwtToken.Claims.First(x => x.Type == "email").Value,
                    Role = jwtToken.Claims.First(x => x.Type == "role").Value
                };
            }
            catch (Exception ex)
            {
                throw new SecurityTokenException($"Invalid token: {ex.Message}");
            }
        }

        public JwtPayload? Decode(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtToken = tokenHandler.ReadJwtToken(token);

                return new JwtPayload
                {
                    Id = jwtToken.Claims.FirstOrDefault(x => x.Type == "id")?.Value ?? string.Empty,
                    Email = jwtToken.Claims.FirstOrDefault(x => x.Type == "email")?.Value ?? string.Empty,
                    Role = jwtToken.Claims.FirstOrDefault(x => x.Type == "role")?.Value ?? string.Empty
                };
            }
            catch
            {
                return null;
            }
        }

        private string GenerateToken(JwtPayload payload, string expiration)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secret);

            var claims = new List<Claim>
            {
                new Claim("id", payload.Id),
                new Claim("email", payload.Email),
                new Claim("role", payload.Role)
            };

            var expires = ParseExpiration(expiration);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expires,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private DateTime ParseExpiration(string expiration)
        {
            if (expiration.EndsWith("d"))
            {
                var days = int.Parse(expiration[..^1]);
                return DateTime.UtcNow.AddDays(days);
            }
            else if (expiration.EndsWith("h"))
            {
                var hours = int.Parse(expiration[..^1]);
                return DateTime.UtcNow.AddHours(hours);
            }
            else if (expiration.EndsWith("m"))
            {
                var minutes = int.Parse(expiration[..^1]);
                return DateTime.UtcNow.AddMinutes(minutes);
            }
            else
            {
                // Default to 1 day if format is not recognized
                return DateTime.UtcNow.AddDays(1);
            }
        }
    }

    public class JwtPayload
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
