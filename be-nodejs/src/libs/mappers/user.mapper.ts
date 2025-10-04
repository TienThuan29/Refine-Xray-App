import { User } from "@/models/user.model";
import { hmacSha256 } from "../hashing";
import { UserProfileResponse } from "@/types/res/user.res";

export const mapUserToUserProfileResponse = async (user: User) => {
    return {
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        role: await hmacSha256(user.role),
        isEnable: user.isEnable,
        lastLoginDate: user.lastLoginDate,
        createdDate: user.createdDate,
        updatedDate: user.updatedDate,
    } as UserProfileResponse;
}