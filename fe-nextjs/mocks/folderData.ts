import { Folder } from '../types/folder';
import { ChatSession } from '../types/chatsession';
import { ChatItem } from '../types/chatsession';


export const mockChatItems: ChatItem[] = [
  {
    id: 'chat-1',
    title: 'Initial Consultation',
    content: 'Hello, I need help with my X-ray analysis.',
    isBot: false,
    imageUrls: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'],
    createdDate: '2024-01-15T10:30:00Z',
    updatedDate: '2024-01-15T10:30:00Z'
  },
  {
    id: 'chat-2',
    title: 'AI Response',
    content: 'I can help you analyze your X-ray. Please upload the image and I\'ll provide a detailed analysis.',
    isBot: true,
    imageUrls: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop'],
    createdDate: '2024-01-15T10:31:00Z',
    updatedDate: '2024-01-15T10:31:00Z'
  },
  {
    id: 'chat-3',
    title: 'Follow-up Question',
    content: 'What specific areas should I focus on in the X-ray?',
    isBot: false,
    createdDate: '2024-01-15T10:32:00Z',
    updatedDate: '2024-01-15T10:32:00Z'
  }
];

export const mockItems: ChatSession[] = [
  {
    id: 'item-1',
    title: 'Chest X-ray Analysis',
    chatItems: mockChatItems,
    createdDate: '2024-01-15T10:30:00Z',
    updatedDate: '2024-01-15T10:32:00Z'
  },
  {
    id: 'item-2',
    title: 'Bone Fracture Detection',
    chatItems: [
      {
        id: 'chat-4',
        title: 'Fracture Analysis',
        content: 'I suspect a fracture in the right tibia. Can you confirm?',
        isBot: false,
        createdDate: '2024-01-16T09:15:00Z',
        updatedDate: '2024-01-16T09:15:00Z'
      },
      {
        id: 'chat-5',
        title: 'AI Confirmation',
        content: 'Yes, I can confirm there is a clear fracture in the right tibia. The fracture appears to be transverse and well-aligned.',
        isBot: true,
        createdDate: '2024-01-16T09:16:00Z',
        updatedDate: '2024-01-16T09:16:00Z'
      }
    ],
    createdDate: '2024-01-16T09:15:00Z',
    updatedDate: '2024-01-16T09:16:00Z'
  },
  {
    id: 'item-3',
    title: 'Lung Condition Review',
    chatItems: [
      {
        id: 'chat-6',
        title: 'Lung Analysis',
        content: 'Please analyze the lung fields for any abnormalities.',
        isBot: false,
        createdDate: '2024-01-17T14:20:00Z',
        updatedDate: '2024-01-17T14:20:00Z'
      }
    ],
    createdDate: '2024-01-17T14:20:00Z',
    updatedDate: '2024-01-17T14:20:00Z'
  }
];

export const mockFolders: Folder[] = [
  {
    id: 'folder-1',
    title: 'Chest X-rays',
    chatSessions: [mockItems[0], mockItems[2]], // Chest X-ray Analysis, Lung Condition Review
    createdDate: '2024-01-10T08:00:00Z',
    updatedDate: '2024-01-15T10:32:00Z'
  },
  {
    id: 'folder-2',
    title: 'Bone Fractures',
    chatSessions: [mockItems[1]], // Bone Fracture Detection
    createdDate: '2024-01-12T09:30:00Z',
    updatedDate: '2024-01-16T09:16:00Z'
  },
  {
    id: 'folder-3',
    title: 'Emergency Cases',
    chatSessions: [], // Empty for now
    createdDate: '2024-01-14T16:45:00Z',
    updatedDate: '2024-01-17T14:20:00Z'
  }
];
