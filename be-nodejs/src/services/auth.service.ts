import { verifyHash } from "@/libs/hashing";
import logger from "@/libs/logger";
import { mapUserToUserProfileResponse } from "@/libs/mappers/user.mapper";
import { User } from "@/models/user.model";
import { UserRepository } from "@/repositories/user.repo";
import {
      AuthResponse,
      LoginCredentials,
      RegisterData,
} from "@/types/auth.type";
import { UserProfileResponse } from "@/types/res/user.res";
import { JwtUtil } from "@/utils/jwt.util";

export class AuthService {

      private userRepository: UserRepository;


      constructor() {
            this.userRepository = new UserRepository();
      }


      public async getProfile(accessToken: string): Promise<UserProfileResponse> {
            const decoded = await JwtUtil.verify(accessToken);
            const userId = decoded.id;
            const user = await this.userRepository.findById(userId);
            if (!user || !user.isEnable) {
                  throw new Error('User not found or inactive');
            }
            const userProfile: UserProfileResponse = await mapUserToUserProfileResponse(user);
            return userProfile;
      }


      public async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
            const decoded = await JwtUtil.verify(refreshToken);

            const user = await this.userRepository.findById(decoded.id);
            if (!user || !user.isEnable) {
                  throw new Error('User not found or inactive');
            }

            const tokenPayload = {
                  id: user.id.toString(),
                  email: user.email,
                  role: user.role,
            };
            const accessToken = await JwtUtil.generateAccessToken(tokenPayload);

            return { accessToken: accessToken };
      }


      public async authenticate(credentials: LoginCredentials): Promise<AuthResponse> {
            const user = await this.userRepository.findByEmail(credentials.email);

            if (!user || !user.isEnable) {
                  throw new Error("Invalid email or password");
            }
            const isPasswordValid = await verifyHash(credentials.password, user.password);

            if (!isPasswordValid) {
                  throw new Error("Invalid email or password");
            }
            const tokenPayload = {
                  id: user.id.toString(),
                  email: user.email,
                  role: user.role,
            };

            const accessToken = await JwtUtil.generateAccessToken(tokenPayload);
            const refreshToken = await JwtUtil.generateRefreshToken(tokenPayload);
            const authResponse: AuthResponse = {
                  userProfile: await mapUserToUserProfileResponse(user),
                  accessToken,
                  refreshToken,
            };

            return authResponse;
      }


      public async createAccount(registerData: RegisterData): Promise<AuthResponse> {
            console.log(registerData);
            const existingUser = await this.userRepository.findByEmail(registerData.email);
            // console.log(`Existing user: ${existingUser}`);
            if (existingUser) {
                  throw new Error("Email already exists");
            }

            // console.log(`Register data: ${registerData}`);

            const user = await this.userRepository.create({
                  email: registerData.email,
                  fullname: registerData.fullname,
                  password: registerData.password,
                  phone: registerData.phone,
                  dateOfBirth: registerData.dateOfBirth instanceof Date ? registerData.dateOfBirth : new Date(registerData.dateOfBirth),
                  role: registerData.role
            } as User);

            // console.log(`User: ${user}`);

            if (user != null) {
                  const tokenPayload = {
                        id: user.id.toString(),
                        email: user.email,
                        role: user.role,
                  };
      
                  const accessToken = await JwtUtil.generateAccessToken(tokenPayload);
                  const refreshToken = await JwtUtil.generateRefreshToken({
                        id: user.id.toString(),
                        email: user.email,
                        role: user.role
                  });
                  const authResponse: AuthResponse = {
                        userProfile: await mapUserToUserProfileResponse(user!),
                        accessToken,
                        refreshToken,
                  };
      
                  return authResponse;
            }

            throw new Error("An error occurred while creating the account");
      }
}
