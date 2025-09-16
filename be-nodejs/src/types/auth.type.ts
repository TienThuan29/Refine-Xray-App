import { JwtPayload } from 'jsonwebtoken';
import { UserProfileResponse } from './res/user.res';
import { Role } from '@/models/user.model';

export interface JWTPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    fullname: string;
    password: string;
    phone: string;
    dateOfBirth: Date | string;
    role: Role;
}


export interface AuthResponse {
    userProfile: UserProfileResponse;
    accessToken: string;
    refreshToken: string;
}