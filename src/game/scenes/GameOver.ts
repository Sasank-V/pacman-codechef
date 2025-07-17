import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class GameOver extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText: Phaser.GameObjects.Text;

    constructor() {
        super("GameOver");
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x000000);

        // Get camera dimensions for responsive positioning
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        this.gameOverText = this.add
            .text(centerX, centerY - 50, "GAME OVER", {
                fontFamily: "Arial Black",
                fontSize: 64,
                color: "#ff0000",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(centerX, centerY + 50, "Press R to Restart", {
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
            .text(centerX, centerY + 100, "Press M for Main Menu", {
                fontFamily: "Arial Black",
                fontSize: 24,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Listen for input
        this.input.keyboard!.on("keydown-R", () => {
            this.scene.start("Game");
        });

        this.input.keyboard!.on("keydown-M", () => {
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
        if (this.gameOverText) {
            this.gameOverText.setPosition(centerX, centerY - 50);
        }

        // Update text positions
        this.children.each((child: any) => {
            if (child.type === "Text") {
                if (child.text === "Press R to Restart") {
                    child.setPosition(centerX, centerY + 50);
                } else if (child.text === "Press M for Main Menu") {
                    child.setPosition(centerX, centerY + 100);
                }
            }
        });
    }

    changeScene() {
        this.scene.start("MainMenu");
    }
}
