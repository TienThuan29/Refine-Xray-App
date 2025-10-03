import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import dayjs from 'dayjs';
import { Api } from '@/configs/api';
import { Constant } from '@/configs/constant';
import { useMemo, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { AuthTokens, UserProfile } from '@/types/user';
import { PageUrl } from '@/configs/page.url';

const useAxios = () => {
    const { authTokens, setUser, setAuthTokens } = useAuth();

    // Memoize setUser and setAuthTokens to prevent unnecessary re-renders
    const memoizedSetUser = useCallback((userProfile: UserProfile) => setUser(userProfile), [setUser]);
    const memoizedSetAuthTokens = useCallback((tokens: AuthTokens) => setAuthTokens(tokens), [setAuthTokens]);

    const AxiosInstance = useMemo(() => {
        const instance = axios.create({
            baseURL: Api.BASE_API,
            headers: {
                Authorization: `Bearer ${authTokens?.accessToken}`
            }
        });

        instance.interceptors.request.use(async req => {
            const user = jwtDecode(authTokens?.accessToken || '{}');
            const isExpired = user.exp ? dayjs.unix(user.exp).diff(dayjs()) < 1 : true;
            if (!isExpired) return req;

            const response = await axios.post(Api.BASE_API + Api.Auth.REFRESH_TOKEN, {
                refreshToken: authTokens?.refreshToken
            }, {
                headers: {
                    Authorization: `Bearer ${authTokens?.refreshToken}`,
                }
            });

            memoizedSetAuthTokens(response.data);
            memoizedSetUser(jwtDecode(response.data.access_token));
            localStorage.setItem(Constant.AUTH_TOKEN_KEY, JSON.stringify(response.data));

            req.headers.Authorization = `Bearer ${response.data.access_token}`;
            return req;
        });

        // Add response interceptor to handle JWT invalid/expired
        instance.interceptors.response.use(
            response => response,
            error => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    // Clear tokens and user
                    memoizedSetAuthTokens(null as any);
                    memoizedSetUser(null as any);
                    localStorage.removeItem(Constant.AUTH_TOKEN_KEY);
                    // Redirect to login page
                    window.location.replace(PageUrl.LOGIN_PAGE);
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, [authTokens, memoizedSetAuthTokens, memoizedSetUser]);

    return AxiosInstance;
}

export default useAxios;
