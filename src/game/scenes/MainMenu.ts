import { GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";

export class MainMenu extends Scene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super("MainMenu");
    }

    create() {
        // Set black background
        this.cameras.main.setBackgroundColor(0x000000);

        // Get camera dimensions for responsive positioning
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Create Pac-Man title
        // this.title = this.add
        //     .text(centerX, centerY - 150, "PAC-MAN", {
        //         fontFamily: "Arial Black",
        //         fontSize: 64,
        //         color: "#ffff00",
        //         stroke: "#0000ff",
        //         strokeThickness: 8,
        //         align: "center",
        //     })
        //     .setOrigin(0.5)
        //     .setDepth(100);

        // Add instructions
        this.add
            .text(centerX, centerY - 50, "Press SPACE to Start Game", {
                fontFamily: "Arial Black",
                fontSize: 24,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(centerX, centerY, "Use Arrow Keys or WASD to Move", {
                fontFamily: "Arial",
                fontSize: 18,
                color: "#cccccc",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Add some visual elements
        this.logo = this.add
            .image(centerX, centerY + 100, "pacman_0")
            .setDepth(100)
            .setScale(2);

        // Add flashing start prompt
        const startText = this.add
            .text(centerX, centerY - 50, "Press SPACE to Start Game", {
                fontFamily: "Arial Black",
                fontSize: 24,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setName("startText");

        this.tweens.add({
            targets: startText,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1,
        });

        // Listen for spacebar
        this.input.keyboard!.on("keydown-SPACE", () => {
            this.changeScene();
        });

        // Handle window resize
        this.scale.on("resize", this.handleResize, this);

        EventBus.emit("current-scene-ready", this);
    }

    handleResize(gameSize: any) {
        const { width, height } = gameSize;
        const centerX = width / 2;
        const centerY = height / 2;

        // Update positions of all elements
        if (this.title) {
            this.title.setPosition(centerX, centerY - 150);
        }

        if (this.logo) {
            this.logo.setPosition(centerX, centerY + 100);
        }

        // Update text positions
        this.children.each((child: any) => {
            if (child.type === "Text") {
                if (child.text === "Press SPACE to Start Game") {
                    child.setPosition(centerX, centerY - 50);
                } else if (child.text === "Use Arrow Keys or WASD to Move") {
                    child.setPosition(centerX, centerY);
                }
            }
        });
    }

    changeScene() {
        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }

        // Play credit sound when starting game
        this.sound.play("credit", { volume: 0.3 });

        this.scene.start("Game");
    }

    moveLogo(reactCallback: ({ x, y }: { x: number; y: number }) => void) {
        const { width, height } = this.cameras.main;

        if (this.logoTween) {
            if (this.logoTween.isPlaying()) {
                this.logoTween.pause();
            } else {
                this.logoTween.play();
            }
        } else {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: {
                    value: width * 0.75,
                    duration: 3000,
                    ease: "Back.easeInOut",
                },
                y: {
                    value: height * 0.15,
                    duration: 1500,
                    ease: "Sine.easeOut",
                },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback) {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y),
                        });
                    }
                },
            });
        }
    }
}
