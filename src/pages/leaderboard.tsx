import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "../styles/Home.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

interface LeaderboardEntry {
    name: string;
    score: number;
    level: number;
    date: string;
}

interface ScoreEntry {
    score: number;
    date: string;
    level: number;
}

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [legacyScores, setLegacyScores] = useState<ScoreEntry[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Load new leaderboard format (with usernames)
        const savedLeaderboard = localStorage.getItem("pacman-leaderboard");
        if (savedLeaderboard) {
            setLeaderboard(JSON.parse(savedLeaderboard));
        }

        // Load legacy scores format (without usernames) as fallback
        const savedScores = localStorage.getItem("pacman-scores");
        if (savedScores) {
            setLegacyScores(JSON.parse(savedScores));
        }

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

    const clearScores = () => {
        if (confirm("Are you sure you want to clear all scores?")) {
            localStorage.removeItem("pacman-leaderboard");
            localStorage.removeItem("pacman-scores");
            localStorage.removeItem("pacman-highscore");
            setLeaderboard([]);
            setLegacyScores([]);
        }
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

    const displayData = leaderboard.length > 0 ? leaderboard : legacyScores;

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
                                        PLAY
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
                                {displayData.length > 0 ? (
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
