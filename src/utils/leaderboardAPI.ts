import {
    LeaderboardResponse,
    SubmitScoreRequest,
    SubmitScoreResponse,
    ApiError,
} from "../types/leaderboard";

const API_BASE = "/api/leaderboard";

export class LeaderboardAPI {
    /**
     * Submit a new score to the leaderboard
     */
    static async submitScore(
        scoreData: SubmitScoreRequest
    ): Promise<SubmitScoreResponse> {
        try {
            const response = await fetch(`${API_BASE}/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(scoreData),
            });

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || "Failed to submit score");
            }

            return await response.json();
        } catch (error) {
            console.error("Error submitting score:", error);
            throw error;
        }
    }

    /**
     * Get leaderboard data with optional pagination
     */
    static async getLeaderboard(
        limit: number = 10,
        skip: number = 0
    ): Promise<LeaderboardResponse> {
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                skip: skip.toString(),
            });

            const response = await fetch(`${API_BASE}?${params}`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || "Failed to fetch leaderboard");
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            throw error;
        }
    }
}

// Utility function for local storage fallback
export const LocalStorageLeaderboard = {
    getKey: () => "pacman-leaderboard",

    get: () => {
        try {
            const data = localStorage.getItem(LocalStorageLeaderboard.getKey());
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    set: (leaderboard: any[]) => {
        try {
            localStorage.setItem(
                LocalStorageLeaderboard.getKey(),
                JSON.stringify(leaderboard)
            );
        } catch (error) {
            console.warn("Failed to save to localStorage:", error);
        }
    },
};

// Hybrid approach: try API first, fallback to localStorage
export const HybridLeaderboard = {
    async submitScore(scoreData: SubmitScoreRequest) {
        try {
            // Try API first
            const result = await LeaderboardAPI.submitScore(scoreData);

            // Update local storage as backup
            LocalStorageLeaderboard.set(result.data.leaderboard);

            return result;
        } catch (error) {
            console.warn(
                "API submission failed, using localStorage fallback:",
                error
            );

            // Fallback to localStorage
            const localLeaderboard = LocalStorageLeaderboard.get();
            const newEntry = {
                ...scoreData,
                date: new Date().toISOString(),
                timestamp: Date.now(),
            };

            localLeaderboard.push(newEntry);
            localLeaderboard.sort((a: any, b: any) => b.score - a.score);
            const trimmed = localLeaderboard.slice(0, 10);

            LocalStorageLeaderboard.set(trimmed);

            return {
                message: "Score saved locally",
                data: {
                    submittedScore: newEntry,
                    leaderboard: trimmed,
                    rank:
                        trimmed.findIndex(
                            (entry: any) =>
                                entry.timestamp === newEntry.timestamp
                        ) + 1,
                },
            };
        }
    },

    async getLeaderboard(limit: number = 10, skip: number = 0) {
        try {
            // Try API first
            return await LeaderboardAPI.getLeaderboard(limit, skip);
        } catch (error) {
            console.warn(
                "API fetch failed, using localStorage fallback:",
                error
            );

            // Fallback to localStorage
            const localLeaderboard = LocalStorageLeaderboard.get();
            const sliced = localLeaderboard.slice(skip, skip + limit);

            return {
                message: "Leaderboard loaded from local storage",
                data: {
                    leaderboard: sliced.map((entry: any, index: number) => ({
                        ...entry,
                        rank: skip + index + 1,
                    })),
                    pagination: {
                        total: localLeaderboard.length,
                        limit,
                        skip,
                        hasMore: skip + limit < localLeaderboard.length,
                    },
                    stats: {
                        totalPlayers: localLeaderboard.length,
                        highestScore: localLeaderboard[0]?.score || 0,
                        averageScore:
                            localLeaderboard.length > 0
                                ? Math.round(
                                      localLeaderboard.reduce(
                                          (sum: number, entry: any) =>
                                              sum + entry.score,
                                          0
                                      ) / localLeaderboard.length
                                  )
                                : 0,
                        highestLevel: Math.max(
                            ...localLeaderboard.map(
                                (entry: any) => entry.level
                            ),
                            0
                        ),
                    },
                },
            };
        }
    },
};
