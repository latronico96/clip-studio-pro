export interface Clip {
    id: string;
    videoId: string;
    startTime: number;
    endTime: number;
    title: string;
    status: 'PENDING' | 'PROCESSING' | 'UPLOADING' | 'SUCCESS' | 'ERROR';
    platforms: ('youtube' | 'tiktok')[];
    verticalMode?: boolean;
    url?: string;
    createdAt: string;
}
