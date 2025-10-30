export type UserProfile = {
    email: string;
    fullname: string;
    phone?: string;
    dateOfBirth?: Date;
    role: string; // hased role
    isEnable: boolean;
    lastLoginDate?: Date;
    createdDate?: Date;
    updatedDate?: Date;
}

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};