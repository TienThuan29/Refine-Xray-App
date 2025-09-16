
export type PatientProfile = {
    id: string;
    fullname: string;
    gender: Gender;
    phone?: string;
    houseNumber?: string;
    commune?: Commune;
    province?: Province;
    nation?: string;
}

export type Commune = {
    code: string;
    name: string;
    englishName: string;
    administrativeLevel: string;
    provinceCode: string;
    provinceName: string;
    decree: string;
}

export type Province = {
    code: string;
    name: string;
    englishName: string;
    administrativeLevel: string;
    decree: string;
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}