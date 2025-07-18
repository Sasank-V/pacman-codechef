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
        // Fullscreen functionality
        const requestFullscreen = async () => {
            try {
                if (!document.fullscreenElement) {
                    if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                    } else if ((document.documentElement as any).webkitRequestFullscreen) {
                        await (document.documentElement as any).webkitRequestFullscreen();
                    } else if ((document.documentElement as any).msRequestFullscreen) {
                        await (document.documentElement as any).msRequestFullscreen();
                    }
                    setIsFullscreen(true);
                }
            } catch (error) {
                console.log("Fullscreen request failed:", error);
            }
        };

        // Function to force fullscreen if not already in fullscreen
        const forceFullscreen = () => {
            if (!document.fullscreenElement) {
                requestFullscreen();
            }
        };

        // Listen for fullscreen changes
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isCurrentlyFullscreen);
            
            // If user exits fullscreen, try to re-enter after a short delay
            if (!isCurrentlyFullscreen) {
                setTimeout(() => {
                    forceFullscreen();
                }, 1000);
            }
        };

        // Listen for various fullscreen events
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("msfullscreenchange", handleFullscreenChange);

        // Request fullscreen on user interaction
        const handleUserInteraction = () => {
            forceFullscreen();
            // Remove listeners after first interaction
            document.removeEventListener("click", handleUserInteraction);
            document.removeEventListener("keydown", handleUserInteraction);
            document.removeEventListener("touchstart", handleUserInteraction);
        };

        // Add interaction listeners
        document.addEventListener("click", handleUserInteraction);
        document.addEventListener("keydown", handleUserInteraction);
        document.addEventListener("touchstart", handleUserInteraction);

        // Also try to request fullscreen immediately
        const immediateFullscreen = setTimeout(() => {
            forceFullscreen();
        }, 500);

        // Keyboard shortcut for fullscreen (F key or F11)
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'f' || event.key === 'F' || event.key === 'F11') {
                event.preventDefault();
                if (!document.fullscreenElement) {
                    forceFullscreen();
                } else {
                    document.exitFullscreen?.();
                }
            }
            // ESC key warning
            if (event.key === 'Escape' && document.fullscreenElement) {
                // Show a brief message that ESC will exit fullscreen
                console.log("Press F to re-enter fullscreen");
            }
        };

        document.addEventListener('keydown', handleKeyPress);

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
            clearTimeout(immediateFullscreen);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.removeEventListener("msfullscreenchange", handleFullscreenChange);
            document.removeEventListener("click", handleUserInteraction);
            document.removeEventListener("keydown", handleUserInteraction);
            document.removeEventListener("touchstart", handleUserInteraction);
            document.removeEventListener("keydown", handleKeyPress);
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
                                onClick={() => {
                                    if (!document.fullscreenElement) {
                                        document.documentElement.requestFullscreen?.();
                                    } else {
                                        document.exitFullscreen?.();
                                    }
                                }}
                                className={styles.fullscreenButton}
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                {isFullscreen ? "🗗" : "⛶"}
                            </button>
                            <button
                                onClick={handleEndGame}
                                className={styles.endGameButton}
                                title="End Game and Save Score"
                            >
                                EXIT
                            </button>
                        </div>
                    </div>

                    {/* Fullscreen notification */}
                    {!isFullscreen && (
                        <div className={styles.fullscreenWarning}>
                            <div className={styles.warningContent}>
                                🎮 For the best gaming experience, please play in fullscreen!
                                <button 
                                    onClick={() => document.documentElement.requestFullscreen?.()}
                                    className={styles.warningButton}
                                >
                                    Go Fullscreen
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.gameArea}>
                        <PacManGameWithoutSSR onGameOver={handleGameOver} />
                    </div>
                </div>
            </main>
        </>
    );
}
