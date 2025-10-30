import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/user';
import { Constant } from '@/configs/constant';

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
    const hasRole = async (role: string): Promise<boolean> => {
        try {
            return user.role === role;
        } catch (error) {
            console.error('Error hashing role for comparison:', error);
            return false;
        }
    };

    return {
        isAdmin: await hasRole(Constant.ROLES.ADMIN),
        isDoctor: await hasRole(Constant.ROLES.DOCTOR),
        isPatient: await hasRole(Constant.ROLES.PATIENT),
        hasRole: hasRole,
        getUserRole: () => user.role
    };
};

export const useRoleValidator = (user: UserProfile | null) => {
    const [roleValidator, setRoleValidator] = useState<{
        isAdmin: boolean;
        isDoctor: boolean;
        hasRole: (role: string) => boolean | Promise<boolean>;
        getUserRole: () => string | null;
    }>({
        isAdmin: false,
        isDoctor: false,
        hasRole: (role: string) => false,
        getUserRole: () => null
    });

    useEffect(() => {
        const loadRoleValidator = async () => {
            const validator = await validateUserRole(user);
            setRoleValidator(validator);
        };
        
        loadRoleValidator();
    }, [user]);

    return roleValidator;
};
