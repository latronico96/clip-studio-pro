export interface Video {
    id: string;
    title: string;
    description?: string;
    thumbnail: string;
    duration: number; // in seconds
    publishedAt: string;
    url: string;
    source: 'youtube' | 'upload';
}
