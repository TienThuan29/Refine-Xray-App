'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthTokens, UserProfile } from '@/types/user';
import axios from 'axios';
import { Api } from '@/configs/api';
import { toast } from 'sonner';
import { permanentRedirect, useRouter } from 'next/navigation'
import HttpStatus from '@/configs/http';
import { Constant } from '@/configs/constant';
import { PageUrl } from '@/configs/page.url';
import { validateUserRole } from '@/hooks/useRoleValidator';

const AUTH_TOKENS_KEY = Constant.AUTH_TOKEN_KEY;
const USER_PROFILE_KEY = Constant.USER_PROFILE_KEY;

type UserContextType = {
    user: UserProfile | null,
    authTokens: AuthTokens | null,
    login: (username: string, password: string) => void,
    logout: () => void,
    isLoggedIn: () => boolean,
    setUser: (user: UserProfile) => void,
    setAuthTokens: (authTokens: AuthTokens) => void,
    sessionExpired: boolean,
    handleSessionExpired: () => void
}

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [authTokens, setAuthTokens] = useState<AuthTokens | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isReady, setIsReady] = useState<boolean>(false);
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);
    
    // Check if refresh token is expired
    const isRefreshTokenExpired = (refreshToken: string): boolean => {
        try {
            // JWT tokens have 3 parts separated by dots
            const parts = refreshToken.split('.');
            if (parts.length !== 3) return true;
            
            // Decode the payload (second part)
            const payload = JSON.parse(atob(parts[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Check if token is expired
            return payload.exp < currentTime;
        } catch (error) {
            // If we can't decode the token, consider it expired
            return true;
        }
    };

    // Check token expiration and handle session expiry
    const checkTokenExpiration = () => {
        if (authTokens?.refreshToken) {
            if (isRefreshTokenExpired(authTokens.refreshToken)) {
                setSessionExpired(true);
                return true;
            }
        }
        return false;
    };

    const handleSessionExpired = () => {
        // Clear all authentication data
        localStorage.removeItem(AUTH_TOKENS_KEY);
        localStorage.removeItem(USER_PROFILE_KEY);
        setUser(null);
        setAuthTokens(null);
        setSessionExpired(false);
    };
    
    const fetchUser = async (tokens: AuthTokens) => {
        try {
            const response = await axios.get(Api.BASE_API + Api.Auth.GET_PROFILE, {
                headers: {
                    'Authorization': `Bearer ${tokens.accessToken}`
                }
            });
            
            if (response.status === HttpStatus.OK) {
                const userProfile = response.data.dataResponse;
                setUser(userProfile);
                // Cache user profile in localStorage
                localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
                return userProfile;
            }
            
            return response.data.dataResponse;
        } 
        catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === HttpStatus.UNAUTHORIZED) {
                // Check if it's due to token expiration
                if (checkTokenExpiration()) {
                    return;
                }
                logout();
            }
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const authTokensString = localStorage.getItem(AUTH_TOKENS_KEY);
            const tokens = authTokensString ? JSON.parse(authTokensString) : null;
            
            // Check if tokens are missing or expired
            if (!tokens || (tokens && isRefreshTokenExpired(tokens.refreshToken))) {
                setSessionExpired(true);
                setIsReady(true);
                return;
            }
            
            const cachedUserString = localStorage.getItem(USER_PROFILE_KEY);
            const cachedUser = cachedUserString ? JSON.parse(cachedUserString) : null;
            
            if (tokens) { 
                setAuthTokens(tokens);
                if (cachedUser) {
                    setUser(cachedUser);
                    await fetchUser(tokens);
                } 
                else {
                    await fetchUser(tokens);
                }
            }
            
            setIsReady(true);
        };

        initAuth();
    }, []);

    // Check token expiration periodically
    useEffect(() => {
        if (!authTokens) return;

        const checkInterval = setInterval(() => {
            checkTokenExpiration();
        }, 60000); // Check every minute

        return () => clearInterval(checkInterval);
    }, [authTokens]);


    const login = async (email: string, password: string) => {
        const authenticationRequest = {
            email: email,
            password: password
        }
        try {
            const response = await axios.post(Api.BASE_API + Api.Auth.LOGIN, authenticationRequest);
            if (response.status === HttpStatus.OK) {
                const tokens = {
                    accessToken: response.data.dataResponse.accessToken,
                    refreshToken: response.data.dataResponse.refreshToken
                }
                setAuthTokens(tokens);
                localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens));

                const userProfile = await fetchUser(tokens);
                const roleValidator = validateUserRole(userProfile);

                if (roleValidator.isSystem) {
                    router.push(PageUrl.SYSTEM_DASHBOARD_PAGE);
                }
                else if (roleValidator.isAdmin) {
                    router.push(PageUrl.SYSTEM_DASHBOARD_PAGE);
                }
                else if (roleValidator.isDoctor) {
                    router.push(PageUrl.HOME_PAGE);
                }
                else {
                    toast.error('Invalid role!');
                }
            }
            else if (response.status === HttpStatus.UNAUTHORIZED) {
                toast.error(response.data.message);
            }
        }
        catch (error) {
            console.log(error);
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message);
            } 
            else {
                toast.error('An unexpected error occurred');
            }
        }
    }


    const logout = () => {
        localStorage.removeItem(AUTH_TOKENS_KEY);
        localStorage.removeItem(USER_PROFILE_KEY);
        setUser(null);
        setAuthTokens(null);
        permanentRedirect(PageUrl.LOGIN_PAGE);
    }

    const isLoggedIn = (): boolean => {
        return !!user;
    }


    return (
        <UserContext.Provider value={{
            login, user, authTokens, logout, isLoggedIn, setUser, setAuthTokens,
            sessionExpired, handleSessionExpired
        }}>
            {isReady ? children : null}
        </UserContext.Provider>
    )

}

export const useAuth = () => useContext(UserContext);