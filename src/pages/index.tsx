import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "../styles/Home.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Landing() {
    const [highScore, setHighScore] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Load high score from localStorage
        const savedHighScore = localStorage.getItem("pacman-highscore");
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore));
        }

        // Start animation after component mounts
        setTimeout(() => setIsAnimating(true), 100);
    }, []);

    return (
        <>
            <Head>
                <title>PAC-MAN - Classic Arcade Game</title>
                <meta
                    name="description"
                    content="Play the legendary PAC-MAN arcade game! Collect dots, avoid ghosts, and beat the high score."
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

                    {/* Top score display */}
                    <div className={styles.scoreDisplay}>
                        <div className={styles.scoreLabel}>HIGH SCORE</div>
                        <div className={styles.scoreValue}>
                            {highScore.toLocaleString()}
                        </div>
                    </div>

                    {/* Main logo with retro styling */}
                    <div
                        className={`${styles.retroTitle} ${
                            isAnimating ? styles.titleGlow : ""
                        }`}
                    >
                        <div className={styles.pacmanLogo}>
                            <span className={styles.logoText}>PAC</span>
                            <img
                                src="/assets/pacman/pac_man_0.png"
                                alt="Pac-Man"
                                className={styles.pacmanSprite}
                            />
                            <span className={styles.logoText}>MAN</span>
                        </div>
                        <div className={styles.titleSubtext}>
                            ARCADE CLASSIC
                        </div>
                    </div>

                    {/* Game elements animation */}
                    <div className={styles.gameElements}>
                        <div className={styles.dotRow}>
                            <img
                                src="/assets/pacman/pill.png"
                                alt="dot"
                                className={styles.dotSprite}
                            />
                            <img
                                src="/assets/pacman/pill.png"
                                alt="dot"
                                className={styles.dotSprite}
                            />
                            <img
                                src="/assets/pacman/pill.png"
                                alt="dot"
                                className={styles.dotSprite}
                            />
                            <img
                                src="/assets/pacman/power_pill.png"
                                alt="power pellet"
                                className={styles.powerPelletSprite}
                            />
                            <img
                                src="/assets/pacman/pill.png"
                                alt="dot"
                                className={styles.dotSprite}
                            />
                            <img
                                src="/assets/pacman/pill.png"
                                alt="dot"
                                className={styles.dotSprite}
                            />
                            <img
                                src="/assets/pacman/pill.png"
                                alt="dot"
                                className={styles.dotSprite}
                            />
                        </div>
                        <div className={styles.characterRow}>
                            <img
                                src="/assets/pacman/pac_man_1.png"
                                alt="Pac-Man"
                                className={styles.pacmanCharSprite}
                            />
                            <img
                                src="/assets/pacman/ghost_red.png"
                                alt="Red Ghost"
                                className={styles.ghostSprite}
                            />
                            <img
                                src="/assets/pacman/ghost_pink.png"
                                alt="Pink Ghost"
                                className={styles.ghostSprite}
                            />
                            <img
                                src="/assets/pacman/ghost_blue.png"
                                alt="Blue Ghost"
                                className={styles.ghostSprite}
                            />
                            <img
                                src="/assets/pacman/ghost_orange.png"
                                alt="Orange Ghost"
                                className={styles.ghostSprite}
                            />
                        </div>
                    </div>

                    {/* Control buttons */}
                    <div className={styles.controlPanel}>
                        <Link href="/game" className={styles.arcadeButton}>
                            <div className={styles.buttonText}>
                                <span className={styles.buttonIcon}>▶</span>
                                START
                            </div>
                        </Link>

                        <Link
                            href="/leaderboard"
                            className={styles.arcadeButton}
                        >
                            <div className={styles.buttonText}>
                                <span className={styles.buttonIcon}>★</span>
                                HIGH SCORES
                            </div>
                        </Link>
                    </div>

                    {/* Bottom credits */}
                    <div className={styles.credits}>
                        <p className={styles.insertCoin}>
                            PRESS START TO BEGIN
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
