import { useMemo } from 'react';
import { UserProfile } from '@/types/user';
import { Constant } from '@/configs/constant';
import { hashString } from '@/lib/hashing';

export const validateUserRole = (user: UserProfile | null) => {
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
    const hasRole = (role: string): boolean => {
        try {
            const hashedRole = hashString(role);
            return hashedUserRole === hashedRole;
        } catch (error) {
            console.error('Error hashing role for comparison:', error);
            return false;
        }
    };

    return {
        isSystem: hasRole(Constant.ROLES.SYSTEM),
        isAdmin: hasRole(Constant.ROLES.ADMIN),
        isDoctor: hasRole(Constant.ROLES.DOCTOR),
        hasRole: hasRole,
        getUserRole: () => hashedUserRole
    };
};


export const useRoleValidator = (user: UserProfile | null) => {
    return useMemo(() => validateUserRole(user), [user]);
};
