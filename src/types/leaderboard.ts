// Types for Leaderboard API

export interface LeaderboardEntry {
    name: string;
    score: number;
    level: number;
    date: string;
    timestamp?: number;
    rank?: number;
}

export interface LeaderboardStats {
    totalPlayers: number;
    highestScore: number;
    averageScore: number;
    highestLevel: number;
}

export interface LeaderboardPagination {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

export interface LeaderboardResponse {
    message: string;
    data: {
        leaderboard: LeaderboardEntry[];
        pagination: LeaderboardPagination;
        stats: LeaderboardStats;
    };
}

export interface SubmitScoreRequest {
    name: string;
    score: number;
    level: number;
}

export interface SubmitScoreResponse {
    message: string;
    data: {
        submittedScore: LeaderboardEntry;
        leaderboard: LeaderboardEntry[];
        rank: number;
    };
}

export interface ApiError {
    message: string;
    error?: string;
}
