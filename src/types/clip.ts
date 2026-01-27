export interface Clip {
    id: string;
    videoId: string;
    startTime: number; // in seconds
    endTime: number; // in seconds
    title: string;
    status: 'pending' | 'processing' | 'uploading' | 'success' | 'error';
    platforms: ('youtube' | 'tiktok')[];
    verticalMode?: boolean;
    url?: string;
    createdAt: string;
}
