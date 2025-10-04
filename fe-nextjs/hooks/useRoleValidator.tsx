import { useMemo } from 'react';
import { UserProfile } from '@/types/user';
import { Constant } from '@/configs/constant';
import { hmacSha256, verifyHmacSha256 } from '@/lib/hashing';

export const validateUserRole = async (user: UserProfile | null) => {
    if (!user) {
        return {
            isSystem: false,
            isAdmin: false,
            isDoctor: false,
            hasRole: (role: string) => false,
            getUserRole: () => null
        };
    }

    const hashedUserRole = user.role;
    const hasRole = async (role: string): Promise<boolean> => {
        try {
            // const hashedRole = await hmacSha256(role);
            // console.log(hashedRole);
            console.log(hashedUserRole);
            return await verifyHmacSha256(role, hashedUserRole);
        } catch (error) {
            console.error('Error hashing role for comparison:', error);
            return false;
        }
    };

    return {
        isSystem: await hasRole(Constant.ROLES.SYSTEM),
        isAdmin: await hasRole(Constant.ROLES.ADMIN),
        isDoctor: await hasRole(Constant.ROLES.DOCTOR),
        hasRole: hasRole,
        getUserRole: () => hashedUserRole
    };
};


export const useRoleValidator = (user: UserProfile | null) => {
    return useMemo(() => validateUserRole(user), [user]);
};
