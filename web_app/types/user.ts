export type UserProfile = {
    id: string; // plain text id
    email: string;
    fullname: string;
    phone?: string;
    dateOfBirth?: Date;
    role: string; // plain text role
    isEnable: boolean;
    lastLoginDate?: Date;
    createdDate?: Date;
    updatedDate?: Date;
}

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};