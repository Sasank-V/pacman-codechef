import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { PhaserGame, IRefPhaserGame } from "../PhaserGame";

interface PacManGameProps {
    onGameOver?: (score: number) => void;
}

const PacManGame = forwardRef<IRefPhaserGame, PacManGameProps>(
    ({ onGameOver }, ref) => {
        const phaserRef = useRef<IRefPhaserGame | null>(null);

        useImperativeHandle(ref, () => ({
            game: phaserRef.current?.game || null,
            scene: phaserRef.current?.scene || null,
        }));

        useEffect(() => {
            // Listen for game events from Phaser
            const handleGameEvent = (event: CustomEvent) => {
                const { type, data } = event.detail;

                if (type === "gameOver" && onGameOver) {
                    onGameOver(data.score);
                }

                if (type === "scoreUpdate") {
                    // Emit custom event for parent components
                    window.dispatchEvent(
                        new CustomEvent("pacman-game-update", {
                            detail: data,
                        })
                    );
                }
            };

            window.addEventListener(
                "phaser-game-event",
                handleGameEvent as EventListener
            );

            return () => {
                window.removeEventListener(
                    "phaser-game-event",
                    handleGameEvent as EventListener
                );
            };
        }, [onGameOver]);

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#000",
                }}
            >
                <PhaserGame ref={phaserRef} currentActiveScene={() => {}} />
            </div>
        );
    }
);

PacManGame.displayName = "PacManGame";

export default PacManGame;
