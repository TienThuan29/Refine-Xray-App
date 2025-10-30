import { useCallback } from 'react';
import { Api } from '@/configs/api';
import { UserProfile, AuthTokens } from '@/types/user';
import { Constant } from '@/configs/constant';

export interface CreateUserData {
  fullname: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  role: string;
}

export interface UpdateUserData {
  fullname?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  role?: string;
  password?: string;
}

export interface UpdateUserStatusData {
  isEnable: boolean;
}

export const useUserService = () => {
  const getAuthHeaders = useCallback((authTokens: AuthTokens | null) => {
    if (!authTokens?.accessToken) {
      throw new Error('No authentication token found');
    }
    
    return {
      'Authorization': `Bearer ${authTokens.accessToken}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const handleAuthError = useCallback((response: Response) => {
    if (response.status === 401) {
      localStorage.removeItem(Constant.AUTH_TOKEN_KEY);
      localStorage.removeItem(Constant.USER_PROFILE_KEY);
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
  }, []);

  const getAllUsers = useCallback(async (authTokens: AuthTokens | null): Promise<UserProfile[]> => {
    try {
      const response = await fetch(`${Api.BASE_API}${Api.System.GET_ALL_USERS}`, {
        method: 'GET',
        headers: getAuthHeaders(authTokens),
      });

      if (!response.ok) {
        handleAuthError(response);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }

      const data = await response.json();
      return data.dataResponse || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }, [getAuthHeaders, handleAuthError]);

  const getUserByEmail = useCallback(async (email: string, authTokens: AuthTokens | null): Promise<UserProfile> => {
    try {
      const response = await fetch(`${Api.BASE_API}${Api.System.GET_USER_BY_EMAIL}`, {
        method: 'POST',
        headers: getAuthHeaders(authTokens),
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        handleAuthError(response);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user');
      }

      const data = await response.json();
      return data.dataResponse;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }, [getAuthHeaders, handleAuthError]);

  const createUser = useCallback(async (userData: CreateUserData, authTokens: AuthTokens | null): Promise<UserProfile> => {
    try {
      const response = await fetch(`${Api.BASE_API}${Api.System.CREATE_ACCOUNT}`, {
        method: 'POST',
        headers: getAuthHeaders(authTokens),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        handleAuthError(response);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const data = await response.json();
      return data.dataResponse.userProfile;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }, [getAuthHeaders, handleAuthError]);

  const updateUser = useCallback(async (email: string, userData: UpdateUserData, authTokens: AuthTokens | null): Promise<UserProfile> => {
    try {
      const response = await fetch(`${Api.BASE_API}${Api.System.UPDATE_USER}`, {
        method: 'PUT',
        headers: getAuthHeaders(authTokens),
        body: JSON.stringify({ email, ...userData }),
      });

      if (!response.ok) {
        handleAuthError(response);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const data = await response.json();
      return data.dataResponse;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, [getAuthHeaders, handleAuthError]);

  const deleteUser = useCallback(async (email: string, authTokens: AuthTokens | null): Promise<boolean> => {
    try {
      const response = await fetch(`${Api.BASE_API}${Api.System.DELETE_USER}`, {
        method: 'DELETE',
        headers: getAuthHeaders(authTokens),
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        handleAuthError(response);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      const data = await response.json();
      return data.dataResponse.deleted;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }, [getAuthHeaders, handleAuthError]);

  const updateUserStatus = useCallback(async (email: string, statusData: UpdateUserStatusData, authTokens: AuthTokens | null): Promise<UserProfile> => {
    try {
      const response = await fetch(`${Api.BASE_API}${Api.System.UPDATE_USER_STATUS}`, {
        method: 'PATCH',
        headers: getAuthHeaders(authTokens),
        body: JSON.stringify({ email, ...statusData }),
      });

      if (!response.ok) {
        handleAuthError(response);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user status');
      }

      const data = await response.json();
      return data.dataResponse;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }, [getAuthHeaders, handleAuthError]);

  return {
    getAllUsers,
    getUserByEmail,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
  };
};
