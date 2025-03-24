export interface User {
    id: string;
    name: string;
    registrationDate?: string;
    lastActionDate?: string;
}

export interface Category {
    id?: string;
    userId: string;
    name: string;
    createdAt?: string;
}

export interface ShoppingListItem {
    id?: string;
    name: string;
    userId: string;
    categoryId: string;
    quantity: number;
    purchased: boolean;
    createdAt?: string;
    purchasedDate?: string;
}

export interface TelegramWebAppUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

export interface TelegramWebApp {
    close: () => void;
    expand: () => void;
    ready: () => void;
    isExpanded: boolean;
    colorScheme: 'light' | 'dark';
    setHeaderColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    initDataUnsafe: {
        user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
        };
        start_param?: string;
    };
} 