import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        // Get query parameters
        const { limit = "10", skip = "0" } = req.query;

        // Validate query parameters
        const limitNum = parseInt(limit as string);
        const skipNum = parseInt(skip as string);

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res
                .status(400)
                .json({ message: "Limit must be between 1 and 100" });
        }

        if (isNaN(skipNum) || skipNum < 0) {
            return res
                .status(400)
                .json({ message: "Skip must be 0 or greater" });
        }

        // Connect to MongoDB
        const client = await clientPromise;
        const db = client.db("pacman_game");
        const collection = db.collection("leaderboard");

        // Get leaderboard data
        const leaderboard = await collection
            .find({})
            .sort({ score: -1, timestamp: 1 }) // Sort by score desc, then by timestamp asc for ties
            .skip(skipNum)
            .limit(limitNum)
            .project({ _id: 0 }) // Exclude MongoDB _id field
            .toArray();

        // Get total count for pagination
        const totalCount = await collection.countDocuments({});

        // Get stats
        const stats = await collection
            .aggregate([
                {
                    $group: {
                        _id: null,
                        totalPlayers: { $sum: 1 },
                        highestScore: { $max: "$score" },
                        averageScore: { $avg: "$score" },
                        highestLevel: { $max: "$level" },
                    },
                },
            ])
            .toArray();

        // Format leaderboard with ranks
        const formattedLeaderboard = leaderboard.map((entry, index) => ({
            ...entry,
            rank: skipNum + index + 1,
        }));

        res.status(200).json({
            message: "Leaderboard retrieved successfully",
            data: {
                leaderboard: formattedLeaderboard,
                pagination: {
                    total: totalCount,
                    limit: limitNum,
                    skip: skipNum,
                    hasMore: skipNum + limitNum < totalCount,
                },
                stats:
                    stats.length > 0
                        ? {
                              totalPlayers: stats[0].totalPlayers,
                              highestScore: stats[0].highestScore,
                              averageScore: Math.round(stats[0].averageScore),
                              highestLevel: stats[0].highestLevel,
                          }
                        : {
                              totalPlayers: 0,
                              highestScore: 0,
                              averageScore: 0,
                              highestLevel: 0,
                          },
            },
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({
            message: "Internal server error",
            error:
                process.env.NODE_ENV === "development"
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : undefined,
        });
    }
}
