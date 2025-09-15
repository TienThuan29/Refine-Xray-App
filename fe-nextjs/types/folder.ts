
export interface MenuItem {
    key: string;
    icon?: React.ReactNode;
    label: string;
    isNew?: boolean;
    isFolder?: boolean;
    isSubItem?: boolean;
    isExpanded?: boolean;
    itemCount?: number;
    parentFolder?: string;
}


export type Folder = {
    id: string;
    title: string;
    chatSessions: ChatSession[];
    createdDate: string;
    updatedDate: string;
}

export type ChatSession = {
    id: string;
    title: string;
    chatItems: ChatItem[];
    createdDate?: string;
    updatedDate?: string;
}

export type ChatItem = {
    id: string;
    title: string;
    content: string;
    imageUrls?: string[];
    isBot: boolean;
    createdDate?: string;
    updatedDate?: string;
}