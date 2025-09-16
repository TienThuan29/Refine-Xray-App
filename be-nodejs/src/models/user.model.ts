
export type User = {
    id: string;
    email: string;
    password: string;
    fullname: string;
    phone?: string;
    dateOfBirth?: Date;
    role: Role;
    isEnable: boolean;
    lastLoginDate?: Date;
    createdDate?: Date;
    updatedDate?: Date;
}

export enum Role {
    DOCTOR = 'DOCTOR',
    ADMIN = 'ADMIN',
    SYSTEM = 'SYSTEM',
}