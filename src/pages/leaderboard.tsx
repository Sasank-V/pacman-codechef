import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "../styles/Home.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { HybridLeaderboard } from "../utils/leaderboardAPI";

const inter = Inter({ subsets: ["latin"] });

interface LeaderboardEntry {
    name: string;
    score: number;
    level: number;
    date: string;
}

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Load data from API with fallback to localStorage
                const result = await HybridLeaderboard.getLeaderboard(100, 0);

                if (result.data.leaderboard) {
                    setLeaderboard(result.data.leaderboard);
                }
            } catch (err) {
                console.error("Failed to load leaderboard:", err);
                setError("Failed to load leaderboard data");

                // Fallback to localStorage only
                const savedLeaderboard =
                    localStorage.getItem("pacman-leaderboard");
                if (savedLeaderboard) {
                    setLeaderboard(JSON.parse(savedLeaderboard));
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadLeaderboard();

        // Start animation after component mounts
        setTimeout(() => setIsAnimating(true), 100);

        // Listen for leaderboard updates from the game
        const handleLeaderboardUpdate = (event: CustomEvent) => {
            if (event.detail?.data?.leaderboard) {
                setLeaderboard(event.detail.data.leaderboard);
            }
        };

        window.addEventListener(
            "phaser-game-event",
            handleLeaderboardUpdate as EventListener
        );

        return () => {
            window.removeEventListener(
                "phaser-game-event",
                handleLeaderboardUpdate as EventListener
            );
        };
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return (
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
    };

    const getRankEmoji = (index: number) => {
        switch (index) {
            case 0:
                return "🥇";
            case 1:
                return "🥈";
            case 2:
                return "🥉";
            default:
                return `#${index + 1}`;
        }
    };

    const displayData = leaderboard;

    return (
        <>
            <Head>
                <title>PAC-MAN - High Scores</title>
                <meta
                    name="description"
                    content="View high scores for the classic PAC-MAN arcade game"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.png" />
            </Head>
            <main className={`${styles.retroMain} ${inter.className}`}>
                <div className={styles.arcadeScreen}>
                    {/* Retro scanlines effect */}
                    <div className={styles.scanlines}></div>

                    {/* Two-column layout */}
                    <div className={styles.leaderboardLayout}>
                        {/* Left Column - Hall of Fame Header and Controls */}
                        <div className={styles.leftColumn}>
                            {/* Header with PAC-MAN styling */}
                            <div className={styles.scoreDisplay}>
                                <div className={styles.scoreLabel}>
                                    HIGH SCORES
                                </div>
                                <div
                                    className={`${styles.retroTitle} ${
                                        isAnimating ? styles.titleGlow : ""
                                    }`}
                                >
                                    <div className={styles.leaderboardHeader}>
                                        <img
                                            src="/assets/pacman/pac_man_0.png"
                                            alt="Pac-Man"
                                            className={styles.pacmanSprite}
                                        />
                                        <span className={styles.logoText}>
                                            HALL OF FAME
                                        </span>
                                        <img
                                            src="/assets/pacman/ghost_red.png"
                                            alt="Ghost"
                                            className={styles.pacmanSprite}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Control buttons with retro styling */}
                            <div className={styles.controlPanel}>
                                <Link href="/" className={styles.arcadeButton}>
                                    <div className={styles.buttonText}>
                                        HOME
                                    </div>
                                </Link>

                                <Link
                                    href="/game"
                                    className={styles.arcadeButton}
                                >
                                    <div className={styles.buttonText}>
                                        <span className={styles.buttonIcon}>
                                            ▶
                                        </span>
                                        PLAY AGAIN
                                    </div>
                                </Link>

                                {/* Bottom credits */}
                                <div className={styles.credits}>
                                    <p className={styles.insertCoin}>
                                        PRESS PLAY TO BEAT THESE SCORES
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Leaderboard entries */}
                        <div className={styles.rightColumn}>
                            <div className={styles.leaderboardContainer}>
                                {isLoading ? (
                                    <div className={styles.loadingMessage}>
                                        <div className={styles.blinkingText}>
                                            LOADING HIGH SCORES...
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className={styles.errorMessage}>
                                        <div className={styles.blinkingText}>
                                            {error}
                                        </div>
                                        <div className={styles.errorSubtext}>
                                            Using offline data
                                        </div>
                                    </div>
                                ) : displayData.length > 0 ? (
                                    <div className={styles.leaderboardList}>
                                        {displayData.map((entry, index) => (
                                            <div
                                                key={index}
                                                className={`${
                                                    styles.leaderboardEntry
                                                } ${
                                                    index < 3
                                                        ? styles.topThree
                                                        : ""
                                                }`}
                                            >
                                                <div
                                                    className={
                                                        styles.leaderboardRank
                                                    }
                                                >
                                                    {getRankEmoji(index)}
                                                </div>
                                                <div
                                                    className={
                                                        styles.leaderboardInfo
                                                    }
                                                >
                                                    {"name" in entry ? (
                                                        <div
                                                            className={
                                                                styles.playerNameDisplay
                                                            }
                                                        >
                                                            {entry.name}
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={
                                                                styles.playerNameDisplay
                                                            }
                                                        >
                                                            ANONYMOUS
                                                        </div>
                                                    )}
                                                    <div
                                                        className={
                                                            styles.playerStats
                                                        }
                                                    >
                                                        LVL {entry.level} •{" "}
                                                        {formatDate(entry.date)}
                                                    </div>
                                                </div>
                                                <div
                                                    className={
                                                        styles.leaderboardScore
                                                    }
                                                >
                                                    {entry.score.toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.noScores}>
                                        <div className={styles.emptyState}>
                                            <img
                                                src="/assets/pacman/ghost_afraid.png"
                                                alt="Empty"
                                                className={styles.emptyIcon}
                                            />
                                            <p className={styles.emptyText}>
                                                NO SCORES YET
                                            </p>
                                            <p className={styles.emptySubtext}>
                                                BE THE FIRST TO MAKE HISTORY!
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
