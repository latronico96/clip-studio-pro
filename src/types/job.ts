export interface Job {
    id: string;
    type: string;
    payload: JSON;
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    lockedBy: string | null;
    lockedAt: Date | null;
    lastHeartbeat: Date | null;
    error: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    result: JSON | null;
    finishedAt: Date | null;
    attempts: number;
    maxAttempts: number;
}