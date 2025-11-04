export interface Blog {
    id: string;
    create_by: string;
    title: string;
    subtitle?: string;
    content: string;
    image_urls?: string[];
    is_deleted: boolean;
    created_date: string;
    updated_date: string;
}

export interface CreateBlogRequest {
    create_by: string;
    title: string;
    subtitle?: string;
    content: string;
    image_urls?: string[];
}

export interface UpdateBlogRequest {
    create_by: string;
    title: string;
    subtitle?: string;
    content: string;
    image_urls?: string[];
}

