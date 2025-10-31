export type UserProfile = {
    id: string;
    email: string;
    fullname: string;
    phone?: string;
    dateOfBirth?: Date;
    role: string; 
    isEnable: boolean;
    lastLoginDate?: Date;
    createdDate?: Date;
    updatedDate?: Date;
}

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};