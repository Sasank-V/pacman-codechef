import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

interface ScoreData {
    name: string;
    score: number;
    level: number;
    date: string;
    timestamp?: number;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { name, score, level }: ScoreData = req.body;

        // Validate input data
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "Valid name is required" });
        }

        if (!score || typeof score !== "number" || score < 0) {
            return res.status(400).json({ message: "Valid score is required" });
        }

        if (!level || typeof level !== "number" || level < 1) {
            return res.status(400).json({ message: "Valid level is required" });
        }

        // Connect to MongoDB
        const client = await clientPromise;
        const db = client.db("pacman_game");
        const collection = db.collection("leaderboard");

        // Prepare score entry
        const scoreEntry: ScoreData = {
            name: name.trim().toUpperCase().substring(0, 15), // Ensure max 15 chars, uppercase
            score: score,
            level: level,
            date: new Date().toISOString(),
            timestamp: Date.now(),
        };

        // Insert the score
        const result = await collection.insertOne(scoreEntry);

        if (!result.acknowledged) {
            throw new Error("Failed to insert score");
        }

        // Get updated leaderboard (top 10)
        const leaderboard = await collection
            .find({})
            .sort({ score: -1, timestamp: 1 }) // Sort by score desc, then by timestamp asc for ties
            .limit(10)
            .project({ _id: 0 }) // Exclude MongoDB _id field
            .toArray();

        res.status(201).json({
            message: "Score submitted successfully",
            data: {
                submittedScore: scoreEntry,
                leaderboard: leaderboard,
                rank:
                    leaderboard.findIndex(
                        (entry) =>
                            entry.name === scoreEntry.name &&
                            entry.score === scoreEntry.score &&
                            entry.timestamp === scoreEntry.timestamp
                    ) + 1,
            },
        });
    } catch (error) {
        console.error("Error submitting score:", error);
        res.status(500).json({
            message: "Internal server error",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
}
