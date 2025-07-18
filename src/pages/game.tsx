import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "../styles/Home.module.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

const PacManGameWithoutSSR = dynamic(() => import("../components/PacManGame"), {
    ssr: false,
});

export default function Game() {
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [gameStatus, setGameStatus] = useState("playing"); // 'playing', 'paused', 'gameOver'
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        // Request fullscreen when the game starts
        const requestFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                }
            } catch (error) {
                console.log("Fullscreen request failed:", error);
            }
        };

        // Listen for fullscreen changes
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        // Request fullscreen after a small delay to ensure user interaction
        const timeoutId = setTimeout(() => {
            requestFullscreen();
        }, 100);

        // Listen for game events
        const handleGameUpdate = (event: CustomEvent) => {
            const { type, data } = event.detail;
            console.log("Update: ", event.detail);

            if (type === "scoreUpdate") {
                const { score, lives, level, status } = data;
                setScore(score);
                setLives(lives);
                setLevel(level);
                setGameStatus(status);
            } else if (type === "navigateToLeaderboard") {
                // Navigate to leaderboard page
                window.location.href = "/leaderboard";
            }
        };

        window.addEventListener(
            "phaser-game-event",
            handleGameUpdate as EventListener
        );

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
            window.removeEventListener(
                "phaser-game-event",
                handleGameUpdate as EventListener
            );
        };
    }, []);

    const handleGameOver = (finalScore: number) => {
        // Save score to localStorage
        const scores = JSON.parse(
            localStorage.getItem("pacman-scores") || "[]"
        );
        const newScore = {
            score: finalScore,
            date: new Date().toISOString(),
            level: level,
        };
        scores.push(newScore);
        scores.sort((a: any, b: any) => b.score - a.score);
        scores.splice(10); // Keep only top 10
        localStorage.setItem("pacman-scores", JSON.stringify(scores));

        // Update high score
        const currentHighScore = parseInt(
            localStorage.getItem("pacman-highscore") || "0"
        );
        if (finalScore > currentHighScore) {
            localStorage.setItem("pacman-highscore", finalScore.toString());
        }
    };

    const handleEndGame = () => {
        // Emit end game event to Phaser - this will trigger the existing username input system
        window.dispatchEvent(
            new CustomEvent("phaser-game-event", {
                detail: {
                    type: "endGame",
                    data: { score: score },
                },
            })
        );

        // Set game status to game over
        setGameStatus("gameOver");
    };

    return (
        <>
            <Head>
                <title>Pac-Man Game - Play Now</title>
                <meta
                    name="description"
                    content="Play the classic Pac-Man game"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.png" />
            </Head>
            <main
                className={`${styles.main} ${styles.fullscreen} ${inter.className}`}
            >
                <div className={styles.gameContainer}>
                    <div className={styles.retroGameHeader}>
                        <div className={styles.gameStats}>
                            <div className={styles.retroStat}>
                                <span className={styles.statLabel}>SCORE</span>
                                <span className={styles.statValue}>
                                    {score.toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.retroStat}>
                                <span className={styles.statLabel}>LIVES</span>
                                <span className={styles.statValue}>
                                    {lives > 0
                                        ? "❤️".repeat(Math.max(0, lives))
                                        : "0"}
                                </span>
                            </div>
                            <div className={styles.retroStat}>
                                <span className={styles.statLabel}>LEVEL</span>
                                <span className={styles.statValue}>
                                    {level}
                                </span>
                            </div>
                        </div>
                        <div className={styles.gameControls}>
                            <button
                                onClick={handleEndGame}
                                className={styles.endGameButton}
                                title="End Game and Save Score"
                            >
                                EXIT
                            </button>
                        </div>
                    </div>

                    <div className={styles.gameArea}>
                        <PacManGameWithoutSSR onGameOver={handleGameOver} />
                    </div>
                </div>
            </main>
        </>
    );
}
