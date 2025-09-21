export type PatientProfileRequest = {
    fullname: string;
    gender: string;
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