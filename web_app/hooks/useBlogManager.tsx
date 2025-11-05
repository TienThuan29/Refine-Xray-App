'use client';

import { useState, useCallback, useMemo } from 'react';
import useAxios from './useAxios';
import { Api } from '@/configs/api';
import { Blog, CreateBlogRequest, UpdateBlogRequest } from '@/types/blog';

export interface BlogManagerState {
    blogs: Blog[];
    currentBlog: Blog | null;
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    isUpdating: boolean;
    isFetching: boolean;
    isDeleting: boolean;
}

export interface BlogManagerActions {
    createBlog: (data: CreateBlogRequest) => Promise<Blog | null>;
    createBlogWithForm: (formData: FormData) => Promise<Blog | null>;
    getBlog: (blogId: string) => Promise<Blog | null>;
    updateBlog: (blogId: string, data: UpdateBlogRequest) => Promise<Blog | null>;
    updateBlogWithForm: (blogId: string, formData: FormData) => Promise<Blog | null>;
    deleteBlog: (blogId: string) => Promise<boolean>;
    listBlogs: () => Promise<Blog[] | null>;
    setCurrentBlog: (blog: Blog | null) => void;
    clearError: () => void;
    refreshBlog: (blogId: string) => Promise<void>;
    refreshBlogs: () => Promise<void>;
}

export type UseBlogManagerReturn = BlogManagerState & BlogManagerActions;

// Backend response type (camelCase)
interface BackendBlogResponse {
    id?: string;
    Id?: string;
    createBy?: string;
    create_by?: string;
    CreateBy?: string;
    title?: string;
    Title?: string;
    subtitle?: string;
    Subtitle?: string;
    content?: string;
    Content?: string;
    imageUrls?: string[];
    image_urls?: string[];
    ImageUrls?: string[];
    isDeleted?: boolean;
    is_deleted?: boolean;
    IsDeleted?: boolean;
    createdDate?: string;
    created_date?: string;
    CreatedDate?: string;
    updatedDate?: string;
    updated_date?: string;
    UpdatedDate?: string;
}

// Helper function to transform backend response (camelCase) to frontend Blog type (snake_case)
const transformBlogResponse = (backendBlog: BackendBlogResponse): Blog => {
    return {
        id: backendBlog.id || backendBlog.Id || '',
        create_by: backendBlog.createBy || backendBlog.create_by || backendBlog.CreateBy || '',
        title: backendBlog.title || backendBlog.Title || '',
        subtitle: backendBlog.subtitle || backendBlog.Subtitle,
        content: backendBlog.content || backendBlog.Content || '',
        image_urls: backendBlog.imageUrls || backendBlog.image_urls || backendBlog.ImageUrls || [],
        is_deleted: backendBlog.isDeleted !== undefined ? backendBlog.isDeleted : (backendBlog.is_deleted !== undefined ? backendBlog.is_deleted : (backendBlog.IsDeleted !== undefined ? backendBlog.IsDeleted : false)),
        created_date: backendBlog.createdDate || backendBlog.created_date || backendBlog.CreatedDate || new Date().toISOString(),
        updated_date: backendBlog.updatedDate || backendBlog.updated_date || backendBlog.UpdatedDate || new Date().toISOString(),
    };
};

const useBlogManager = (): UseBlogManagerReturn => {
    const axios = useAxios();
    
    const [state, setState] = useState<BlogManagerState>({
        blogs: [],
        currentBlog: null,
        loading: false,
        error: null,
        isCreating: false,
        isUpdating: false,
        isFetching: false,
        isDeleting: false,
    });

    const updateState = useCallback((updates: Partial<BlogManagerState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const handleError = useCallback((error: unknown, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                            (error as { message?: string })?.message || 
                            `Failed to ${operation}`;
        updateState({ error: errorMessage });
    }, [updateState]);

    const createBlog = useCallback(async (data: CreateBlogRequest): Promise<Blog | null> => {
        try {
            updateState({ isCreating: true, error: null });
            
            const response = await axios.post(Api.Blog.CREATE_BLOG, data);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to create blog');
            }
            
            const newBlog = response.data.dataResponse;
            
            setState(prev => ({
                ...prev,
                blogs: [newBlog, ...prev.blogs],
                isCreating: false,
            }));
            
            return newBlog;
        } catch (error) {
            handleError(error, 'create blog');
            updateState({ isCreating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const createBlogWithForm = useCallback(async (formData: FormData): Promise<Blog | null> => {
        try {
            updateState({ isCreating: true, error: null });
            
            const response = await axios.post(`${Api.Blog.CREATE_BLOG}/form`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to create blog');
            }
            
            const backendBlog = response.data.dataResponse;
            const newBlog = transformBlogResponse(backendBlog);
            
            setState(prev => ({
                ...prev,
                blogs: [newBlog, ...prev.blogs],
                isCreating: false,
            }));
            
            return newBlog;
        } catch (error) {
            handleError(error, 'create blog');
            updateState({ isCreating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const getBlog = useCallback(async (blogId: string): Promise<Blog | null> => {
        try {
            updateState({ isFetching: true, error: null });
            
            const response = await axios.get(`${Api.Blog.GET_BLOG}/${blogId}`);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to fetch blog');
            }
            
            const backendBlog = response.data.dataResponse;
            const blog = transformBlogResponse(backendBlog);
            
            updateState({
                currentBlog: blog,
                isFetching: false,
            });
            
            return blog;
        } catch (error) {
            handleError(error, 'fetch blog');
            updateState({ isFetching: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const updateBlog = useCallback(async (blogId: string, data: UpdateBlogRequest): Promise<Blog | null> => {
        try {
            updateState({ isUpdating: true, error: null });
            
            const response = await axios.put(`${Api.Blog.UPDATE_BLOG}/${blogId}`, data);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to update blog');
            }
            
            const backendBlog = response.data.dataResponse;
            const updatedBlog = transformBlogResponse(backendBlog);
            
            setState(prev => ({
                ...prev,
                blogs: prev.blogs.map(blog => blog.id === blogId ? updatedBlog : blog),
                currentBlog: prev.currentBlog?.id === blogId ? updatedBlog : prev.currentBlog,
                isUpdating: false,
            }));
            
            return updatedBlog;
        } catch (error) {
            handleError(error, 'update blog');
            updateState({ isUpdating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const updateBlogWithForm = useCallback(async (blogId: string, formData: FormData): Promise<Blog | null> => {
        try {
            updateState({ isUpdating: true, error: null });
            
            const response = await axios.put(`${Api.Blog.UPDATE_BLOG}/${blogId}/form`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to update blog');
            }
            
            const backendBlog = response.data.dataResponse;
            const updatedBlog = transformBlogResponse(backendBlog);
            
            setState(prev => ({
                ...prev,
                blogs: prev.blogs.map(blog => blog.id === blogId ? updatedBlog : blog),
                currentBlog: prev.currentBlog?.id === blogId ? updatedBlog : prev.currentBlog,
                isUpdating: false,
            }));
            
            return updatedBlog;
        } catch (error) {
            handleError(error, 'update blog');
            updateState({ isUpdating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const deleteBlog = useCallback(async (blogId: string): Promise<boolean> => {
        try {
            updateState({ isDeleting: true, error: null });
            
            const response = await axios.delete(`${Api.Blog.DELETE_BLOG}/${blogId}`);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to delete blog');
            }
            
            setState(prev => ({
                ...prev,
                blogs: prev.blogs.filter(blog => blog.id !== blogId),
                currentBlog: prev.currentBlog?.id === blogId ? null : prev.currentBlog,
                isDeleting: false,
            }));
            
            return true;
        } catch (error) {
            handleError(error, 'delete blog');
            updateState({ isDeleting: false });
            return false;
        }
    }, [axios, updateState, handleError]);

    const listBlogs = useCallback(async (): Promise<Blog[] | null> => {
        try {
            updateState({ loading: true, error: null });
            
            const response = await axios.get(Api.Blog.LIST_BLOGS);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to fetch blogs');
            }
            
            const backendBlogs = response.data.dataResponse || [];
            const blogs = backendBlogs.map((backendBlog: BackendBlogResponse) => transformBlogResponse(backendBlog));
            
            updateState({
                blogs,
                loading: false,
            });
            
            return blogs;
        } catch (error) {
            handleError(error, 'fetch blogs');
            updateState({ loading: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const setCurrentBlog = useCallback((blog: Blog | null) => {
        updateState({ currentBlog: blog });
    }, [updateState]);

    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    const refreshBlog = useCallback(async (blogId: string) => {
        await getBlog(blogId);
    }, [getBlog]);

    const refreshBlogs = useCallback(async () => {
        await listBlogs();
    }, [listBlogs]);

    const returnValue = useMemo(() => ({
        blogs: state.blogs,
        currentBlog: state.currentBlog,
        loading: state.loading,
        error: state.error,
        isCreating: state.isCreating,
        isUpdating: state.isUpdating,
        isFetching: state.isFetching,
        isDeleting: state.isDeleting,
        createBlog,
        createBlogWithForm,
        getBlog,
        updateBlog,
        updateBlogWithForm,
        deleteBlog,
        listBlogs,
        setCurrentBlog,
        clearError,
        refreshBlog,
        refreshBlogs,
    }), [
        state,
        createBlog,
        createBlogWithForm,
        getBlog,
        updateBlog,
        updateBlogWithForm,
        deleteBlog,
        listBlogs,
        setCurrentBlog,
        clearError,
        refreshBlog,
        refreshBlogs,
    ]);

    return returnValue;
};

export default useBlogManager;

