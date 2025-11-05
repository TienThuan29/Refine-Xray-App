using IdentityService.Models;
using IdentityService.Web.Requests;
using IdentityService.Web.Responses;
using IdentityService.Repositories.User;
using IdentityService.Utils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IdentityService.Services.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly JwtUtil _jwtUtil;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IUserRepository userRepository,
            JwtUtil jwtUtil,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _jwtUtil = jwtUtil;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<UserProfileResponse> GetProfileAsync(string accessToken)
        {
            try
            {
                var decoded = await _jwtUtil.VerifyAsync(accessToken);
                var userId = decoded.Id;
                var user = await _userRepository.FindByIdAsync(userId);
                
                if (user == null || !user.IsEnable)
                {
                    throw new InvalidOperationException("User not found or inactive");
                }
                
                return UserMapper.MapUserToUserProfileResponse(user, _configuration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user profile");
                throw;
            }
        }

        public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
        {
            try
            {
                var decoded = await _jwtUtil.VerifyAsync(refreshToken);
                var user = await _userRepository.FindByIdAsync(decoded.Id);
                
                if (user == null || !user.IsEnable)
                {
                    throw new InvalidOperationException("User not found or inactive");
                }

                var tokenPayload = new JwtPayload
                {
                    Id = user.Id,
                    Email = user.Email,
                    Role = user.Role.ToString()
                };
                
                var accessToken = _jwtUtil.GenerateAccessToken(tokenPayload);

                return new AuthResponse
                {
                    AccessToken = accessToken,
                    UserProfile = UserMapper.MapUserToUserProfileResponse(user, _configuration)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing token");
                throw;
            }
        }

        public async Task<AuthResponse> AuthenticateAsync(LoginCredentials credentials)
        {
            try
            {
                var user = await _userRepository.FindByEmailAsync(credentials.Email);

                if (user == null)
                {
                    throw new InvalidOperationException("Invalid email or password");
                }

                if (!user.IsEnable)
                {
                    throw new InvalidOperationException("User not found or inactive");
                }

                var isPasswordValid = HashingUtil.VerifyHash(credentials.Password, user.Password, _configuration);

                if (!isPasswordValid)
                {
                    throw new InvalidOperationException("Invalid email or password");
                }

                var tokenPayload = new JwtPayload
                {
                    Id = user.Id,
                    Email = user.Email,
                    Role = user.Role.ToString()
                };

                var accessToken = _jwtUtil.GenerateAccessToken(tokenPayload);
                var refreshToken = _jwtUtil.GenerateRefreshToken(tokenPayload);

                return new AuthResponse
                {
                    UserProfile = UserMapper.MapUserToUserProfileResponse(user, _configuration),
                    AccessToken = accessToken,
                    RefreshToken = refreshToken
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error authenticating user");
                throw;
            }
        }

        public async Task<AuthResponse> CreateAccountAsync(RegisterData registerData)
        {
            try
            {
                _logger.LogInformation("Creating account for email: {Email}", registerData.Email);
                
                var existingUser = await _userRepository.FindByEmailAsync(registerData.Email);
                if (existingUser != null)
                {
                    throw new InvalidOperationException("Email already exists");
                }

                var user = new User
                {
                    Email = registerData.Email,
                    Fullname = registerData.Fullname,
                    Password = registerData.Password,
                    Role = registerData.Role
                };

                var createdUser = await _userRepository.CreateAsync(user);

                if (createdUser != null)
                {
                    var tokenPayload = new JwtPayload
                    {
                        Id = createdUser.Id,
                        Email = createdUser.Email,
                        Role = createdUser.Role.ToString()
                    };

                    var accessToken = _jwtUtil.GenerateAccessToken(tokenPayload);
                    var refreshToken = _jwtUtil.GenerateRefreshToken(tokenPayload);

                    return new AuthResponse
                    {
                        UserProfile = UserMapper.MapUserToUserProfileResponse(createdUser, _configuration),
                        AccessToken = accessToken,
                        RefreshToken = refreshToken
                    };
                }

                throw new InvalidOperationException("An error occurred while creating the account");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating account");
                throw;
            }
        }

        public async Task<User?> GetUserByTokenAsync(string accessToken)
        {
            try
            {
                var decoded = await _jwtUtil.VerifyAsync(accessToken);
                return await _userRepository.FindByIdAsync(decoded.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by token");
                throw;
            }
        }

        public async Task<List<UserProfileResponse>> GetAllUsersAsync()
        {
            try
            {
                var users = await _userRepository.FindAllAsync();
                var userProfiles = new List<UserProfileResponse>();

                foreach (var user in users)
                {
                    userProfiles.Add(UserMapper.MapUserToUserProfileResponse(user, _configuration));
                }

                return userProfiles;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                throw;
            }
        }

        public async Task<UserProfileResponse?> UpdateUserAsync(string userId, User updateData)
        {
            try
            {
                var updatedUser = await _userRepository.UpdateAsync(userId, updateData);
                if (updatedUser == null)
                {
                    return null;
                }
                return UserMapper.MapUserToUserProfileResponse(updatedUser, _configuration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user: {UserId}", userId);
                throw;
            }
        }

        public async Task<UserProfileResponse?> GetUserByEmailAsync(string email)
        {
            try
            {
                var user = await _userRepository.FindByEmailAsync(email);
                if (user == null)
                {
                    return null;
                }
                return UserMapper.MapUserToUserProfileResponse(user, _configuration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by email: {Email}", email);
                throw;
            }
        }

        public async Task<UserProfileResponse?> GetUserByIdAsync(string userId)
        {
            try
            {
                var user = await _userRepository.FindByIdAsync(userId);
                if (user == null)
                {
                    return null;
                }
                return UserMapper.MapUserToUserProfileResponse(user, _configuration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by ID: {UserId}", userId);
                throw;
            }
        }

        public async Task<UserProfileResponse?> UpdateUserByEmailAsync(string email, User updateData)
        {
            try
            {
                var user = await _userRepository.FindByEmailAsync(email);
                if (user == null)
                {
                    return null;
                }
                
                var updatedUser = await _userRepository.UpdateAsync(user.Id, updateData);
                if (updatedUser == null)
                {
                    return null;
                }
                
                return UserMapper.MapUserToUserProfileResponse(updatedUser, _configuration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user by email: {Email}", email);
                throw;
            }
        }

        public async Task<bool> DeleteUserByEmailAsync(string email)
        {
            try
            {
                var user = await _userRepository.FindByEmailAsync(email);
                if (user == null)
                {
                    return false;
                }
                return await _userRepository.DeleteAsync(user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user by email: {Email}", email);
                throw;
            }
        }

        public async Task<UserProfileResponse?> UpdateUserStatusByEmailAsync(string email, bool isEnable)
        {
            try
            {
                var user = await _userRepository.FindByEmailAsync(email);
                if (user == null)
                {
                    return null;
                }
                
                var updatedUser = await _userRepository.UpdateStatusAsync(user.Id, isEnable);
                if (updatedUser == null)
                {
                    return null;
                }
                
                return UserMapper.MapUserToUserProfileResponse(updatedUser, _configuration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status by email: {Email}", email);
                throw;
            }
        }
    }
}

