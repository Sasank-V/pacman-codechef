import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { HybridLeaderboard } from "../../utils/leaderboardAPI";

interface GameState {
    score: number;
    lives: number;
    level: number;
    status: "playing" | "paused" | "gameOver";
}

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    pacman: Phaser.GameObjects.Sprite;
    ghosts: Phaser.GameObjects.Group;
    pills: Phaser.GameObjects.Group;
    powerPills: Phaser.GameObjects.Group;
    walls: Phaser.GameObjects.Group;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    wasdKeys: any;

    gameState: GameState;
    pacmanDirection: string = "right";
    pacmanSpeed: number = 120; // Increased speed for better responsiveness
    ghostSpeed: number = 110; // Increased ghost speed to make them more challenging
    powerMode: boolean = false;
    powerModeTimer: number = 0;
    pacmanDying: boolean = false; // Flag to prevent multiple death triggers

    // Sound management
    sounds: { [key: string]: Phaser.Sound.BaseSound } = {};
    sirenSound: Phaser.Sound.BaseSound | null = null;
    frightSound: Phaser.Sound.BaseSound | null = null;
    dotSoundIndex: number = 0; // Alternate between eat_dot_0 and eat_dot_1

    // Ghost AI properties
    ghostTargets: { [ghostId: string]: { row: number; col: number } } = {};
    ghostModes: { [ghostId: string]: "chase" | "scatter" | "frightened" } = {};
    modeTimer: number = 0;
    scatterCorners = [
        { row: 1, col: 17 }, // Red ghost - top right corner
        { row: 1, col: 1 }, // Pink ghost - top left corner
        { row: 19, col: 17 }, // Blue ghost - bottom right corner
        { row: 19, col: 1 }, // Orange ghost - bottom left corner
    ];

    // Maze layout (1 = wall, 0 = empty, 2 = pill, 3 = power pill)
    maze: number[][] = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 3, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 3, 1],
        [1, 2, 1, 2, 2, 2, 1, 0, 1, 2, 1, 1, 1, 2, 1, 1, 2, 2, 1],
        [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 1, 1, 2, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 2, 1, 0, 1, 0, 1, 0, 1, 2, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 1, 1, 2, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
        [1, 3, 1, 2, 2, 2, 1, 1, 1, 2, 1, 1, 2, 2, 1, 1, 2, 3, 1],
        [1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 2, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    tileSize: number = 40; // Increased for better sprite fit

    constructor() {
        super("Game");
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x000000);

        // Initialize or restore game state from scene data
        const sceneData = this.scene.settings.data as any;
        if (sceneData && sceneData.gameState) {
            // Restore game state from previous scene restart
            this.gameState = { ...sceneData.gameState };
        } else {
            // Initialize new game state
            this.gameState = {
                score: 0,
                lives: 3,
                level: 1,
                status: "playing",
            };
        }

        // Initialize game flags
        this.pacmanDying = false;

        // Create input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasdKeys = this.input.keyboard!.addKeys("W,S,A,D");

        // Add global keyboard filter for game over state - only allow L, M, R
        this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
            // When game is over, only allow L, M, R keys and specific keys for username input
            if (this.gameState.status === "gameOver") {
                const key = event.key.toLowerCase();

                // Allow L, M, R for navigation and basic username input keys
                const allowedKeys = ["l", "m", "r", "enter", "backspace"];

                // Allow alphanumeric characters and space for username input (single character keys)
                const isUsernameChar = /^[a-zA-Z0-9 ]$/.test(event.key);

                // Block all other keys
                if (!allowedKeys.includes(key) && !isUsernameChar) {
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                }
            }
        });

        // Create groups
        this.walls = this.add.group();
        this.pills = this.add.group();
        this.powerPills = this.add.group();
        this.ghosts = this.add.group();

        // Create maze
        this.createMaze();

        // Create Pac-Man
        this.createPacMan();

        // Create ghosts
        this.createGhosts();

        // Create animations
        this.createAnimations();

        // Set up physics with improved collision
        this.physics.add.overlap(
            this.pacman,
            this.pills,
            this.collectPill,
            undefined,
            this
        );
        this.physics.add.overlap(
            this.pacman,
            this.powerPills,
            this.collectPowerPill,
            undefined,
            this
        );
        this.physics.add.overlap(
            this.pacman,
            this.ghosts,
            this.hitGhost,
            undefined,
            this
        );

        // Add colliders with improved settings
        this.physics.add.collider(this.pacman, this.walls);
        this.physics.add.collider(this.ghosts, this.walls);

        // Set world bounds to prevent going off screen (except for warp gates)
        this.physics.world.setBounds(
            0,
            0,
            this.cameras.main.width,
            this.cameras.main.height
        );

        // Handle scale events
        this.scale.on("resize", this.handleResize, this);

        // Initialize sounds
        this.initializeSounds();

        // Listen for end game events from React
        const handleEndGame = (event: CustomEvent) => {
            if (event.detail?.type === "endGame") {
                // Set game status to game over
                this.gameState.status = "gameOver";

                // Stop all sounds
                this.stopSiren();
                this.stopFrightSound();

                // Directly show username input without death animation
                this.showUsernameInput();
            }
        };

        window.addEventListener(
            "phaser-game-event",
            handleEndGame as EventListener
        );

        EventBus.emit("current-scene-ready", this);
        this.emitGameUpdate();
    }

    handleResize(gameSize: any) {
        // Recalculate positions when the game is resized
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (gameSize.width - mazeWidth) / 2;
        const offsetY = (gameSize.height - mazeHeight) / 2;

        // Update wall positions
        this.walls.children.entries.forEach((wall: any, index) => {
            const row = Math.floor(index / this.maze[0].length);
            const col = index % this.maze[0].length;
            wall.setPosition(
                offsetX + col * this.tileSize + this.tileSize / 2,
                offsetY + row * this.tileSize + this.tileSize / 2
            );
        });
    }

    createMaze() {
        // Calculate offsets to center the maze
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (this.cameras.main.width - mazeWidth) / 2;
        const offsetY = (this.cameras.main.height - mazeHeight) / 2;

        for (let row = 0; row < this.maze.length; row++) {
            for (let col = 0; col < this.maze[row].length; col++) {
                const x = offsetX + col * this.tileSize + this.tileSize / 2;
                const y = offsetY + row * this.tileSize + this.tileSize / 2;

                switch (this.maze[row][col]) {
                    case 1: // Wall
                        const wall = this.add.rectangle(
                            x,
                            y,
                            this.tileSize - 2, // Slightly smaller walls for better movement
                            this.tileSize - 2,
                            0x0000ff
                        );
                        this.physics.add.existing(wall, true);
                        this.walls.add(wall);
                        break;
                    case 2: // Pill
                        const pill = this.physics.add.sprite(x, y, "pill");
                        pill.setScale(0.8); // Larger pills for bigger tiles
                        this.pills.add(pill);
                        break;
                    case 3: // Power pill
                        const powerPill = this.physics.add.sprite(
                            x,
                            y,
                            "power_pill"
                        );
                        powerPill.setScale(1.2); // Larger power pills
                        this.powerPills.add(powerPill);
                        break;
                }
            }
        }
    }

    createPacMan() {
        // Calculate offsets to center the maze
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (this.cameras.main.width - mazeWidth) / 2;
        const offsetY = (this.cameras.main.height - mazeHeight) / 2;

        // Start Pac-Man in the center-bottom area (row 17, col 9 - good open area)
        const startX = offsetX + 9 * this.tileSize + this.tileSize / 2;
        const startY = offsetY + 17 * this.tileSize + this.tileSize / 2;

        this.pacman = this.physics.add.sprite(startX, startY, "pacman_0");
        this.pacman.setScale(1.5); // Increased scale to fit larger tiles
        (this.pacman.body as Phaser.Physics.Arcade.Body).setSize(24, 24); // Smaller body for better movement

        // Initialize grid movement data for tile-based movement
        this.pacman.setData("targetX", startX);
        this.pacman.setData("targetY", startY);
        this.pacman.setData("isMoving", false);
        this.pacman.setData("direction", "right");
        this.pacman.setData("nextDirection", "right"); // For buffered input
    }

    createGhosts() {
        // Calculate offsets to center the maze
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (this.cameras.main.width - mazeWidth) / 2;
        const offsetY = (this.cameras.main.height - mazeHeight) / 2;

        const ghostColors = ["red", "pink", "blue", "orange"];
        const startPositions = [
            { x: 9, y: 9 }, // Red ghost - center area
            { x: 8, y: 9 }, // Pink ghost - left of center
            { x: 10, y: 9 }, // Blue ghost - right of center
            { x: 9, y: 10 }, // Orange ghost - below center
        ];

        ghostColors.forEach((color, index) => {
            const pos = startPositions[index];
            const ghost = this.physics.add.sprite(
                offsetX + pos.x * this.tileSize + this.tileSize / 2,
                offsetY + pos.y * this.tileSize + this.tileSize / 2,
                `ghost_${color}`
            );
            ghost.setScale(1.5); // Increased scale to match Pac-Man
            (ghost.body as Phaser.Physics.Arcade.Body).setSize(24, 24); // Smaller body for better movement

            // Set ghost data for AI
            const ghostId = `ghost_${index}`;
            ghost.setData("color", color);
            ghost.setData("id", ghostId);
            ghost.setData(
                "direction",
                ["up", "down", "left", "right"][Math.floor(Math.random() * 4)]
            );
            ghost.setData("lastDirectionChange", 0);
            ghost.setData("isDead", false);

            // Grid movement properties
            ghost.setData("targetX", ghost.x);
            ghost.setData("targetY", ghost.y);
            ghost.setData("isMoving", false);

            // Initialize AI state
            this.ghostModes[ghostId] = "chase";
            this.ghostTargets[ghostId] = { row: pos.y, col: pos.x };

            this.ghosts.add(ghost);
        });
    }

    createAnimations() {
        // Pac-Man eating animation
        if (!this.anims.exists("pacman_chomp")) {
            this.anims.create({
                key: "pacman_chomp",
                frames: [
                    { key: "pacman_0" },
                    { key: "pacman_1" },
                    { key: "pacman_2" },
                    { key: "pacman_1" },
                ],
                frameRate: 8,
                repeat: -1,
            });
        }

        // Pac-Man death animation
        if (!this.anims.exists("pacman_death")) {
            this.anims.create({
                key: "pacman_death",
                frames: [
                    { key: "pacdeath_0" },
                    { key: "pacdeath_1" },
                    { key: "pacdeath_2" },
                ],
                frameRate: 4,
                repeat: 0,
            });
        }

        this.pacman.play("pacman_chomp");
    }

    update() {
        if (this.gameState.status !== "playing") return;

        this.updatePacManMovement();
        this.updateGhosts();
        this.updateGhostAI();
        this.updatePowerMode();
    }

    /**
     * Main Ghost AI update function
     */
    updateGhostAI() {
        // Update mode timer for mode switching
        this.modeTimer += this.game.loop.delta; // Use actual delta time

        // Mode switching logic (every 10 seconds for demo)
        if (this.modeTimer > 10000) {
            this.modeTimer = 0;
            // Switch between chase and scatter modes
            this.ghosts.children.entries.forEach(
                (ghost: any, index: number) => {
                    const ghostId = ghost.getData("id");
                    this.ghostModes[ghostId] =
                        this.ghostModes[ghostId] === "chase"
                            ? "scatter"
                            : "chase";
                }
            );
        }

        // Update each ghost
        this.ghosts.children.entries.forEach((ghost: any, index: number) => {
            // Skip AI updates for dead ghosts
            if (ghost.getData("isDead")) {
                return;
            }

            const ghostId = ghost.getData("id");
            const isMoving = ghost.getData("isMoving");

            // Only update direction when ghost is not moving (at grid intersection)
            if (!isMoving) {
                const currentTime = this.time.now;
                const lastDirectionChange =
                    ghost.getData("lastDirectionChange") || 0;

                // Change direction every 500ms when at intersection for more responsive AI
                if (currentTime - lastDirectionChange > 500) {
                    const newDirection = this.getGhostDirection(ghost, index);
                    ghost.setData("direction", newDirection);
                    ghost.setData("lastDirectionChange", currentTime);

                    // Update target for debugging/visualization
                    this.ghostTargets[ghostId] = this.getGhostTarget(
                        ghost,
                        index
                    );
                }
            }
        });
    }

    updatePacManMovement() {
        // Block movement if game is not in playing state
        if (this.gameState.status !== "playing") {
            const body = this.pacman.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(0, 0);
            return;
        }

        const speed = this.pacmanSpeed;

        // Get input and store as next direction (buffered input)
        let requestedDirection = this.pacman.getData("nextDirection");

        if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
            requestedDirection = "left";
        } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
            requestedDirection = "right";
        } else if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
            requestedDirection = "up";
        } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
            requestedDirection = "down";
        }

        // Store the requested direction for buffering
        this.pacman.setData("nextDirection", requestedDirection);

        // Grid-based movement system (similar to ghosts)
        const targetX = this.pacman.getData("targetX");
        const targetY = this.pacman.getData("targetY");
        const isMoving = this.pacman.getData("isMoving");
        const currentDirection = this.pacman.getData("direction");
        const body = this.pacman.body as Phaser.Physics.Arcade.Body;

        // Check if Pac-Man has reached its target position
        const tolerance = 2; // Small tolerance for floating point precision
        const reachedTarget =
            Math.abs(this.pacman.x - targetX) < tolerance &&
            Math.abs(this.pacman.y - targetY) < tolerance;

        if (!isMoving || reachedTarget) {
            // Snap to exact grid position
            this.pacman.setPosition(targetX, targetY);
            body.setVelocity(0, 0);
            this.pacman.setData("isMoving", false);

            // Try to move in the requested direction first (buffered input)
            let newTarget = this.getPacManNextGridPosition(requestedDirection);
            let directionToUse = requestedDirection;

            // If requested direction is blocked, continue in current direction
            if (!newTarget) {
                newTarget = this.getPacManNextGridPosition(currentDirection);
                directionToUse = currentDirection;
            }

            // If we can move, start moving to the new target
            if (newTarget) {
                this.pacman.setData("targetX", newTarget.x);
                this.pacman.setData("targetY", newTarget.y);
                this.pacman.setData("isMoving", true);
                this.pacman.setData("direction", directionToUse);

                // Set Pac-Man rotation based on direction
                switch (directionToUse) {
                    case "left":
                        this.pacman.setAngle(180);
                        break;
                    case "right":
                        this.pacman.setAngle(0);
                        break;
                    case "up":
                        this.pacman.setAngle(270);
                        break;
                    case "down":
                        this.pacman.setAngle(90);
                        break;
                }

                // Update the pacmanDirection for compatibility
                this.pacmanDirection = directionToUse;
            }
        }

        // If moving, animate towards target
        if (this.pacman.getData("isMoving")) {
            const currentTargetX = this.pacman.getData("targetX");
            const currentTargetY = this.pacman.getData("targetY");

            // Calculate direction vector
            const deltaX = currentTargetX - this.pacman.x;
            const deltaY = currentTargetY - this.pacman.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > 1) {
                // Normalize and apply speed
                const normalizedX = (deltaX / distance) * speed;
                const normalizedY = (deltaY / distance) * speed;
                body.setVelocity(normalizedX, normalizedY);
            } else {
                // Close enough, snap to target
                this.pacman.setPosition(currentTargetX, currentTargetY);
                body.setVelocity(0, 0);
                this.pacman.setData("isMoving", false);
            }
        }

        // Handle warp gates (left and right edges of the maze)
        this.handleWarpGates();
    }

    handleWarpGates() {
        // Calculate maze boundaries with offsets
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (this.cameras.main.width - mazeWidth) / 2;
        const offsetY = (this.cameras.main.height - mazeHeight) / 2;

        const leftEdge = offsetX;
        const rightEdge = offsetX + mazeWidth;
        const warpRow = 9; // Row where the warp tunnel is (middle of the maze)
        const warpY = offsetY + warpRow * this.tileSize + this.tileSize / 2;

        // Check if Pac-Man is at the warp tunnel level (around row 9)
        const pacmanY = this.pacman.y;
        const warpTolerance = this.tileSize;

        if (Math.abs(pacmanY - warpY) < warpTolerance) {
            // Pac-Man is at the warp tunnel level
            if (this.pacman.x < leftEdge - 15) {
                // Pac-Man went off the left edge, warp to right
                const newX = rightEdge - 15;
                this.pacman.setPosition(newX, pacmanY);

                // Update grid movement targets to prevent conflicts
                this.pacman.setData("targetX", newX);
                this.pacman.setData("targetY", pacmanY);
                this.pacman.setData("isMoving", false);

                console.log("Warped from left to right");
            } else if (this.pacman.x > rightEdge + 15) {
                // Pac-Man went off the right edge, warp to left
                const newX = leftEdge + 15;
                this.pacman.setPosition(newX, pacmanY);

                // Update grid movement targets to prevent conflicts
                this.pacman.setData("targetX", newX);
                this.pacman.setData("targetY", pacmanY);
                this.pacman.setData("isMoving", false);

                console.log("Warped from right to left");
            }
        }
    }

    updateGhosts() {
        this.ghosts.children.entries.forEach((ghost: any) => {
            // Skip movement if ghost is dead or game is paused
            if (
                ghost.getData("isDead") ||
                this.gameState.status !== "playing"
            ) {
                // Stop ghost movement when game is paused (e.g., during death animation)
                const body = ghost.body as Phaser.Physics.Arcade.Body;
                body.setVelocity(0, 0);
                return;
            }

            const speed = this.powerMode
                ? this.ghostSpeed * 0.6 // Increased from 0.5 to 0.6 for better movement in power mode
                : this.ghostSpeed;

            // Grid-based movement system
            const targetX = ghost.getData("targetX");
            const targetY = ghost.getData("targetY");
            const isMoving = ghost.getData("isMoving");
            const body = ghost.body as Phaser.Physics.Arcade.Body;

            // Check if ghost has reached its target position
            const tolerance = 2; // Small tolerance for floating point precision
            const reachedTarget =
                Math.abs(ghost.x - targetX) < tolerance &&
                Math.abs(ghost.y - targetY) < tolerance;

            if (!isMoving || reachedTarget) {
                // Ghost is not moving or has reached target, snap to grid and choose new direction
                ghost.setPosition(targetX, targetY);
                body.setVelocity(0, 0);
                ghost.setData("isMoving", false);

                // Get new direction from AI
                const direction = ghost.getData("direction");
                const newTarget = this.getNextGridPosition(ghost, direction);

                if (newTarget) {
                    // Set new target and start moving
                    ghost.setData("targetX", newTarget.x);
                    ghost.setData("targetY", newTarget.y);
                    ghost.setData("isMoving", true);

                    // Calculate velocity to reach target
                    const deltaX = newTarget.x - ghost.x;
                    const deltaY = newTarget.y - ghost.y;
                    const distance = Math.sqrt(
                        deltaX * deltaX + deltaY * deltaY
                    );

                    if (distance > 0) {
                        body.setVelocity(
                            (deltaX / distance) * speed,
                            (deltaY / distance) * speed
                        );
                    }
                }
            }

            // Update ghost appearance based on power mode
            if (this.powerMode) {
                ghost.setTexture("ghost_afraid");
            } else {
                const color = ghost.getData("color");
                ghost.setTexture(`ghost_${color}`);
            }

            // Handle warp gates for ghosts too
            this.handleGhostWarpGates(ghost);
        });
    }

    handleGhostWarpGates(ghost: any) {
        // Calculate maze boundaries with offsets
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (this.cameras.main.width - mazeWidth) / 2;
        const offsetY = (this.cameras.main.height - mazeHeight) / 2;

        const leftEdge = offsetX;
        const rightEdge = offsetX + mazeWidth;
        const warpRow = 9; // Row where the warp tunnel is (middle of the maze)
        const warpY = offsetY + warpRow * this.tileSize + this.tileSize / 2;

        // Check if ghost is at the warp tunnel level (around row 9)
        const ghostY = ghost.y;
        const warpTolerance = this.tileSize;

        if (Math.abs(ghostY - warpY) < warpTolerance) {
            // Ghost is at the warp tunnel level
            if (ghost.x < leftEdge - 15) {
                // Ghost went off the left edge, warp to right
                const newX = rightEdge - 15;
                ghost.setPosition(newX, ghostY);

                // Update grid movement targets to prevent conflicts
                ghost.setData("targetX", newX);
                ghost.setData("targetY", ghostY);
                ghost.setData("isMoving", false);

                console.log("Ghost warped from left to right");
            } else if (ghost.x > rightEdge + 15) {
                // Ghost went off the right edge, warp to left
                const newX = leftEdge + 15;
                ghost.setPosition(newX, ghostY);

                // Update grid movement targets to prevent conflicts
                ghost.setData("targetX", newX);
                ghost.setData("targetY", ghostY);
                ghost.setData("isMoving", false);

                console.log("Ghost warped from right to left");
            }
        }
    }

    updatePowerMode() {
        if (this.powerMode) {
            this.powerModeTimer -= this.game.loop.delta;
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;

                // Restore ghosts to normal state
                this.ghosts.children.entries.forEach((ghost: any) => {
                    // Skip dead ghosts (they'll be restored when respawned)
                    if (ghost.getData("isDead")) {
                        return;
                    }

                    const ghostId = ghost.getData("id");
                    const color = ghost.getData("color");
                    this.ghostModes[ghostId] = "chase";
                    // Restore original ghost texture
                    ghost.setTexture(`ghost_${color}`);
                });

                // Stop fright sound and restart siren
                this.stopFrightSound();
                this.startSiren();
            }
        }
    }

    collectPill(pacman: any, pill: any) {
        pill.destroy();

        // Check for bonus life (classic Pac-Man gives extra life at 10,000 points)
        const oldScore = this.gameState.score;
        this.gameState.score += 10;

        // Check if crossed 10,000 point threshold for extra life
        if (oldScore < 10000 && this.gameState.score >= 10000) {
            this.gameState.lives++;
            this.sounds.extend.play();
        }

        // Play dot eating sound (alternate between two sounds)
        const dotSoundKey =
            this.dotSoundIndex === 0 ? "eat_dot_0" : "eat_dot_1";
        this.sounds[dotSoundKey].play();
        this.dotSoundIndex = 1 - this.dotSoundIndex; // Toggle between 0 and 1

        this.emitGameUpdate();

        // Check if all pills collected
        if (
            this.pills.children.size === 0 &&
            this.powerPills.children.size === 0
        ) {
            this.nextLevel();
        }
    }

    collectPowerPill(pacman: any, powerPill: any) {
        powerPill.destroy();
        this.gameState.score += 50;
        this.powerMode = true;
        this.powerModeTimer = 10000; // 10 seconds

        // Activate frightened mode for all ghosts
        this.ghosts.children.entries.forEach((ghost: any) => {
            const ghostId = ghost.getData("id");
            this.ghostModes[ghostId] = "frightened";
            // Make ghosts blue and afraid
            ghost.setTexture("ghost_afraid");
        });

        // Stop siren and play fright sound
        this.stopSiren();
        this.stopFrightSound();
        this.frightSound = this.sounds.fright;
        this.frightSound.play();

        this.emitGameUpdate();
    }

    hitGhost(pacman: any, ghost: any) {
        if (this.powerMode) {
            // Check if ghost is already dead to prevent multiple score increases
            if (ghost.getData("isDead")) {
                return; // Don't process multiple hits on the same ghost
            }

            // Immediately mark ghost as dead to prevent further collisions
            ghost.setData("isDead", true);

            // Eat the ghost
            this.gameState.score += 200;

            // Play ghost eating sound
            this.sounds.eat_ghost.play();

            // Stop ghost movement and show death effect
            ghost.setData("isDead", true);
            ghost.setVelocity(0, 0);

            // Create a visual effect for ghost death (flash and fade)
            this.tweens.add({
                targets: ghost,
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    // After death animation, respawn ghost
                    this.respawnGhost(ghost);
                },
            });
        } else {
            // Check if Pac-Man is already dying to prevent multiple death triggers
            if (this.pacmanDying) {
                return; // Don't process additional ghost hits during death animation
            }

            // Set dying flag to prevent further collisions
            this.pacmanDying = true;

            // Lose a life
            this.gameState.lives--;

            // Play death sound
            const deathSound = Math.random() < 0.5 ? "death_0" : "death_1";
            this.sounds[deathSound].play();

            // Stop all sounds
            this.stopSiren();
            this.stopFrightSound();

            // Stop Pac-Man movement
            (this.pacman.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

            // Play death animation
            this.pacman.play("pacman_death");

            // Pause the game state to prevent further updates during death animation
            this.gameState.status = "paused";

            // Wait for death animation to complete before proceeding
            this.pacman.once("animationcomplete", () => {
                if (this.gameState.lives <= 0) {
                    this.gameOver();
                } else {
                    this.respawnPacman();
                }
            });
        }
        this.emitGameUpdate();
    }

    respawnGhost(ghost: any) {
        // Calculate offsets to center the maze
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (this.cameras.main.width - mazeWidth) / 2;
        const offsetY = (this.cameras.main.height - mazeHeight) / 2;

        // Spawn ghost at the center of the maze (row 9, col 9 - the ghost house area)
        const respawnX = offsetX + 9 * this.tileSize + this.tileSize / 2;
        const respawnY = offsetY + 9 * this.tileSize + this.tileSize / 2;

        // Immediately set ghost position to center
        ghost.setPosition(respawnX, respawnY);

        // Reset ghost properties to normal state
        ghost.setData("isDead", false);
        ghost.setAlpha(1);

        // Reset grid movement data
        ghost.setData("targetX", respawnX);
        ghost.setData("targetY", respawnY);
        ghost.setData("isMoving", false);

        // Restore original ghost texture and normal behavior
        const color = ghost.getData("color");
        const ghostId = ghost.getData("id");

        // Return to normal chase mode after respawn (not frightened)
        this.ghostModes[ghostId] = "chase";
        ghost.setTexture(`ghost_${color}`);

        // Give ghost a random initial direction to spread out from center
        const directions = ["up", "down", "left", "right"];
        ghost.setData(
            "direction",
            directions[Math.floor(Math.random() * directions.length)]
        );
        ghost.setData("lastDirectionChange", this.time.now);

        // Small delay to make respawn visible and prevent immediate collision
        this.time.delayedCall(100, () => {
            // Ensure ghost is fully restored after brief delay
            ghost.setData("isDead", false);
        });
    }

    respawnPacman() {
        // Reset the dying flag
        this.pacmanDying = false;

        // Calculate offsets to center the maze
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (this.cameras.main.width - mazeWidth) / 2;
        const offsetY = (this.cameras.main.height - mazeHeight) / 2;

        // Reset Pac-Man position to bottom area (row 17, col 9)
        const respawnX = offsetX + 9 * this.tileSize + this.tileSize / 2;
        const respawnY = offsetY + 17 * this.tileSize + this.tileSize / 2;

        this.pacman.setPosition(respawnX, respawnY);
        this.pacmanDirection = "right";
        this.pacman.setAngle(0);

        // Reset Pac-Man grid movement data
        this.pacman.setData("targetX", respawnX);
        this.pacman.setData("targetY", respawnY);
        this.pacman.setData("isMoving", false);
        this.pacman.setData("direction", "right");
        this.pacman.setData("nextDirection", "right");

        // Reset ghosts to their starting positions
        this.ghosts.children.entries.forEach((ghost: any, index) => {
            const startPositions = [
                { x: 9, y: 9 }, // Red ghost - center area
                { x: 8, y: 9 }, // Pink ghost - left of center
                { x: 10, y: 9 }, // Blue ghost - right of center
                { x: 9, y: 10 }, // Orange ghost - below center
            ];
            const pos = startPositions[index];
            const ghostX = offsetX + pos.x * this.tileSize + this.tileSize / 2;
            const ghostY = offsetY + pos.y * this.tileSize + this.tileSize / 2;

            ghost.setPosition(ghostX, ghostY);

            // Reset ghost state and grid movement data
            ghost.setData("isDead", false);
            ghost.setAlpha(1);
            ghost.setData("targetX", ghostX);
            ghost.setData("targetY", ghostY);
            ghost.setData("isMoving", false);

            const ghostId = ghost.getData("id");
            this.ghostModes[ghostId] = "chase";
        });

        this.powerMode = false;

        // Resume game state and restart animations
        this.gameState.status = "playing";
        this.pacman.play("pacman_chomp");

        // Restart the siren after a short delay
        this.time.delayedCall(1000, () => {
            this.startSiren();
        });
    }

    nextLevel() {
        this.gameState.level++;
        this.ghostSpeed += 2;
        console.log("Next Level", this.gameState);

        // Stop all sounds before restarting scene
        this.stopSiren();
        this.stopFrightSound();

        // Play intermission sound
        this.sounds.intermission.play();

        this.emitGameUpdate();

        // Pass current game state to scene restart to preserve progress
        this.scene.restart({ gameState: this.gameState });
        console.log("Restart: ", this.gameState);
    }

    gameOver() {
        this.gameState.status = "gameOver";

        // If death animation isn't already playing, play it
        if (
            !this.pacman.anims.isPlaying ||
            this.pacman.anims.currentAnim?.key !== "pacman_death"
        ) {
            this.pacman.play("pacman_death");
        }

        // Stop all sounds
        this.stopSiren();
        this.stopFrightSound();

        // Show username input after death animation
        this.time.delayedCall(2000, () => {
            this.showUsernameInput();
        });
    }

    showUsernameInput() {
        // Ensure camera is available and has valid dimensions
        if (!this.cameras || !this.cameras.main) {
            console.error("Camera not available for showUsernameInput");
            return;
        }

        const camera = this.cameras.main;
        const centerX = camera.centerX || camera.width / 2 || 400;
        const centerY = camera.centerY || camera.height / 2 || 300;
        const screenWidth = camera.width || 800;
        const screenHeight = camera.height || 600;

        // this.nextLevel();
        // Create a semi-transparent overlay
        const overlay = this.add.rectangle(
            centerX,
            centerY,
            screenWidth,
            screenHeight,
            0x000000,
            0.8
        );
        overlay.setDepth(1000);

        // Create input container
        const container = this.add.container(centerX, centerY);
        container.setDepth(1001);

        // Game Over text
        const gameOverText = this.add.text(0, -120, "GAME OVER", {
            fontSize: "48px",
            color: "#ffff00",
            fontFamily: "Arial Black",
            align: "center",
        });
        gameOverText.setOrigin(0.5);

        // Score text
        const scoreText = this.add.text(
            0,
            -60,
            `FINAL SCORE: ${this.gameState.score}`,
            {
                fontSize: "24px",
                color: "#ffffff",
                fontFamily: "Arial",
                align: "center",
            }
        );
        scoreText.setOrigin(0.5);

        // Username prompt
        const promptText = this.add.text(0, -10, "ENTER YOUR NAME:", {
            fontSize: "20px",
            color: "#ffffff",
            fontFamily: "Arial",
            align: "center",
        });
        promptText.setOrigin(0.5);

        // Input field background
        const inputBg = this.add.rectangle(0, 40, 300, 40, 0x333333);
        inputBg.setStrokeStyle(2, 0xffffff);

        // Username text display
        let username = "";
        const usernameText = this.add.text(0, 40, "", {
            fontSize: "18px",
            color: "#ffffff",
            fontFamily: "Arial",
            align: "center",
        });
        usernameText.setOrigin(0.5);

        // Instructions
        const instructionText = this.add.text(0, 90, "PRESS ENTER TO SUBMIT", {
            fontSize: "16px",
            color: "#ffff00",
            fontFamily: "Arial",
            align: "center",
        });
        instructionText.setOrigin(0.5);

        // Add all elements to container
        container.add([
            gameOverText,
            scoreText,
            promptText,
            inputBg,
            usernameText,
            instructionText,
        ]);

        // Store cursor timer for cleanup
        let cursorTimer: Phaser.Time.TimerEvent | null = null;

        // Handle keyboard input
        const handleKeyboard = async (event: KeyboardEvent) => {
            if (event.key === "Enter" && username.trim().length > 0) {
                // Submit username to leaderboard (trim before submitting)
                await this.submitToLeaderboard(username.trim());

                // Remove event listener
                this.input.keyboard?.off("keydown", handleKeyboard);

                // Clean up cursor timer
                if (cursorTimer) {
                    cursorTimer.destroy();
                    cursorTimer = null;
                }

                // Clean up UI
                overlay.destroy();
                container.destroy();

                // Small delay to ensure clean transition
                this.time.delayedCall(100, () => {
                    // Show final message and navigate options
                    this.showPostGameOptions();
                });
            } else if (event.key === "Enter" && username.trim().length === 0) {
                // Provide visual feedback for empty username
                // Flash the instruction text to indicate name is required
                instructionText.setColor("#ff0000");
                this.time.delayedCall(500, () => {
                    if (instructionText && instructionText.active) {
                        instructionText.setColor("#00ff00");
                    }
                });
            } else if (event.key === "Backspace") {
                username = username.slice(0, -1);
                usernameText.setText(username);
            } else if (event.key.length === 1 && username.length < 15) {
                // Only allow alphanumeric characters and spaces, but prevent starting with space
                if (/[a-zA-Z0-9 ]/.test(event.key)) {
                    // Don't allow adding spaces if username is empty or would result in only spaces
                    if (event.key === " " && username.trim().length === 0) {
                        return; // Ignore space if no non-space characters yet
                    }
                    username += event.key.toUpperCase();
                    usernameText.setText(username);
                }
            }
        };

        // Add keyboard listener
        this.input.keyboard?.on("keydown", handleKeyboard);

        // Auto-focus and show cursor effect
        cursorTimer = this.time.addEvent({
            delay: 500,
            callback: () => {
                if (usernameText && usernameText.active) {
                    const displayText =
                        username + (username.length < 15 ? "|" : "");
                    usernameText.setText(displayText);
                }
            },
            loop: true,
        });
    }

    async submitToLeaderboard(username: string) {
        const leaderboardEntry = {
            name: username,
            score: this.gameState.score,
            level: this.gameState.level,
        };

        try {
            // Submit to API with fallback to localStorage
            const result = await HybridLeaderboard.submitScore(
                leaderboardEntry
            );

            console.log("Score submitted successfully:", result.message);

            // Emit leaderboard update event with API response
            window.dispatchEvent(
                new CustomEvent("phaser-game-event", {
                    detail: {
                        type: "leaderboardUpdate",
                        data: {
                            leaderboard: result.data.leaderboard,
                            newEntry: result.data.submittedScore,
                            rank: result.data.rank,
                        },
                    },
                })
            );

            // Also emit game over event with username
            window.dispatchEvent(
                new CustomEvent("phaser-game-event", {
                    detail: {
                        type: "gameOver",
                        data: {
                            score: this.gameState.score,
                            level: this.gameState.level,
                            username,
                            rank: result.data.rank,
                        },
                    },
                })
            );
        } catch (error) {
            console.error("Failed to submit score:", error);

            // Emit error event but still proceed with game over
            window.dispatchEvent(
                new CustomEvent("phaser-game-event", {
                    detail: {
                        type: "gameOver",
                        data: {
                            score: this.gameState.score,
                            level: this.gameState.level,
                            username: username,
                            error: "Failed to submit score to leaderboard",
                        },
                    },
                })
            );
        }
    }

    showPostGameOptions() {
        // Clear any existing UI elements and timers to prevent overlap
        this.children.list.forEach((child: any) => {
            if (child.depth >= 1000 && child.depth < 2000) {
                child.destroy();
            }
        });

        // Ensure camera is available and has valid dimensions
        if (!this.cameras || !this.cameras.main) {
            console.error("Camera not available for showPostGameOptions");
            return;
        }

        const camera = this.cameras.main;
        const centerX = camera.centerX || camera.width / 2 || 400;
        const centerY = camera.centerY || camera.height / 2 || 300;
        const screenWidth = camera.width || 800;
        const screenHeight = camera.height || 600;

        // Create a semi-transparent overlay with higher depth
        const overlay = this.add.rectangle(
            centerX,
            centerY,
            screenWidth,
            screenHeight,
            0x000000,
            0.9
        );
        overlay.setDepth(2000); // Higher depth than username input

        // Create container for post-game options
        const container = this.add.container(centerX, centerY);
        container.setDepth(2001); // Higher depth than username input

        // Score saved message
        const savedText = this.add.text(0, -80, "SCORE SAVED!", {
            fontSize: "36px",
            color: "#00ff00",
            fontFamily: "Arial Black",
            align: "center",
        });
        savedText.setOrigin(0.5);

        // Final score display
        const finalScoreText = this.add.text(
            0,
            -30,
            `FINAL SCORE: ${this.gameState.score}`,
            {
                fontSize: "24px",
                color: "#ffff00",
                fontFamily: "Arial",
                align: "center",
            }
        );
        finalScoreText.setOrigin(0.5);

        // Navigation instructions
        const instructionsTitle = this.add.text(
            0,
            20,
            "CHOOSE YOUR NEXT ACTION:",
            {
                fontSize: "18px",
                color: "#ffffff",
                fontFamily: "Arial",
                align: "center",
            }
        );
        instructionsTitle.setOrigin(0.5);

        // Key press instructions
        const leaderboardInstr = this.add.text(
            0,
            50,
            "PRESS L FOR HALL OF FAME",
            {
                fontSize: "16px",
                color: "#00ff00",
                fontFamily: "Arial",
                align: "center",
            }
        );
        leaderboardInstr.setOrigin(0.5);

        const playAgainInstr = this.add.text(0, 75, "PRESS R TO PLAY AGAIN", {
            fontSize: "16px",
            color: "#ffaa00",
            fontFamily: "Arial",
            align: "center",
        });
        playAgainInstr.setOrigin(0.5);

        const menuInstr = this.add.text(0, 100, "PRESS M FOR MAIN MENU", {
            fontSize: "16px",
            color: "#ff6600",
            fontFamily: "Arial",
            align: "center",
        });
        menuInstr.setOrigin(0.5);

        // Add all elements to container
        container.add([
            savedText,
            finalScoreText,
            instructionsTitle,
            leaderboardInstr,
            playAgainInstr,
            menuInstr,
        ]);

        // Handle keyboard input for post-game options
        const handlePostGameInput = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();

            // Only process valid keys: L, R, M
            if (!["l", "r", "m"].includes(key)) {
                // Ignore invalid keys completely - don't destroy UI or remove listeners
                return;
            }

            // Remove event listener first (only for valid keys)
            this.input.keyboard?.off("keydown", handlePostGameInput);

            // Clean up UI (only for valid keys)
            overlay.destroy();
            container.destroy();

            switch (key) {
                case "l":
                    // Go to leaderboard
                    window.dispatchEvent(
                        new CustomEvent("phaser-game-event", {
                            detail: {
                                type: "navigateToLeaderboard",
                                data: {},
                            },
                        })
                    );
                    break;
                case "r":
                    // Restart game
                    this.scene.restart();
                    break;
                case "m":
                    // Go to home page
                    window.dispatchEvent(
                        new CustomEvent("phaser-game-event", {
                            detail: {
                                type: "navigateToHome",
                                data: {},
                            },
                        })
                    );
                    break;
            }
        };

        // Add keyboard listener
        this.input.keyboard?.on("keydown", handlePostGameInput);
    }

    initializeSounds() {
        // Initialize all game sounds
        this.sounds = {
            start: this.sound.add("start", { volume: 0.3 }),
            credit: this.sound.add("credit", { volume: 0.3 }),
            intermission: this.sound.add("intermission", { volume: 0.3 }),
            eat_dot_0: this.sound.add("eat_dot_0", { volume: 0.2 }),
            eat_dot_1: this.sound.add("eat_dot_1", { volume: 0.2 }),
            eat_fruit: this.sound.add("eat_fruit", { volume: 0.4 }),
            eat_ghost: this.sound.add("eat_ghost", { volume: 0.4 }),
            death_0: this.sound.add("death_0", { volume: 0.4 }),
            death_1: this.sound.add("death_1", { volume: 0.4 }),
            extend: this.sound.add("extend", { volume: 0.4 }),
            eyes: this.sound.add("eyes", { volume: 0.3, loop: true }),
            eyes_firstloop: this.sound.add("eyes_firstloop", { volume: 0.3 }),
            fright: this.sound.add("fright", { volume: 0.3, loop: true }),
            fright_firstloop: this.sound.add("fright_firstloop", {
                volume: 0.3,
            }),
            siren0: this.sound.add("siren0", { volume: 0.2, loop: true }),
            siren0_firstloop: this.sound.add("siren0_firstloop", {
                volume: 0.2,
            }),
            siren1: this.sound.add("siren1", { volume: 0.2, loop: true }),
            siren1_firstloop: this.sound.add("siren1_firstloop", {
                volume: 0.2,
            }),
            siren2: this.sound.add("siren2", { volume: 0.2, loop: true }),
            siren2_firstloop: this.sound.add("siren2_firstloop", {
                volume: 0.2,
            }),
            siren3: this.sound.add("siren3", { volume: 0.2, loop: true }),
            siren3_firstloop: this.sound.add("siren3_firstloop", {
                volume: 0.2,
            }),
            siren4: this.sound.add("siren4", { volume: 0.2, loop: true }),
            siren4_firstloop: this.sound.add("siren4_firstloop", {
                volume: 0.2,
            }),
        };

        // Play start sound when game begins
        this.sounds.start.play();

        // Start the appropriate siren based on level
        this.startSiren();
    }

    startSiren() {
        // Stop any existing siren
        this.stopSiren();

        // Choose siren based on level (classic Pac-Man behavior)
        const sirenLevel = Math.min(this.gameState.level - 1, 4);
        const sirenKey = `siren${sirenLevel}`;

        if (this.sounds[sirenKey]) {
            this.sirenSound = this.sounds[sirenKey];
            this.sirenSound.play();
        }
    }

    stopSiren() {
        if (this.sirenSound && this.sirenSound.isPlaying) {
            this.sirenSound.stop();
        }
        this.sirenSound = null;
    }

    stopFrightSound() {
        if (this.frightSound && this.frightSound.isPlaying) {
            this.frightSound.stop();
        }
        this.frightSound = null;
    }

    emitGameUpdate() {
        console.log("Game State: ", this.gameState);
        window.dispatchEvent(
            new CustomEvent("phaser-game-event", {
                detail: {
                    type: "scoreUpdate",
                    data: {
                        score: this.gameState.score,
                        lives: this.gameState.lives,
                        level: this.gameState.level,
                        status: this.gameState.status,
                    },
                },
            })
        );
    }

    // ===== GHOST AI IMPLEMENTATION =====

    // Calculate Manhattan distance between two point
    manhattanDistance(
        pos1: { row: number; col: number },
        pos2: { row: number; col: number }
    ): number {
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }

    /**
     * Convert world position to maze grid coordinates
     */
    worldToGrid(x: number, y: number): { row: number; col: number } {
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (this.cameras.main.width - mazeWidth) / 2;
        const offsetY = (this.cameras.main.height - mazeHeight) / 2;

        const col = Math.floor((x - offsetX) / this.tileSize);
        const row = Math.floor((y - offsetY) / this.tileSize);

        return {
            row: Math.max(0, Math.min(this.maze.length - 1, row)),
            col: Math.max(0, Math.min(this.maze[0].length - 1, col)),
        };
    }

    /**
     * Convert grid coordinates to world position
     */
    gridToWorld(row: number, col: number): { x: number; y: number } {
        const mazeWidth = this.maze[0].length * this.tileSize;
        const mazeHeight = this.maze.length * this.tileSize;
        const offsetX = (this.cameras.main.width - mazeWidth) / 2;
        const offsetY = (this.cameras.main.height - mazeHeight) / 2;

        return {
            x: offsetX + col * this.tileSize + this.tileSize / 2,
            y: offsetY + row * this.tileSize + this.tileSize / 2,
        };
    }

    /**
     * Check if a grid position is walkable (not a wall)
     */
    isWalkable(row: number, col: number): boolean {
        if (
            row < 0 ||
            row >= this.maze.length ||
            col < 0 ||
            col >= this.maze[0].length
        ) {
            return false;
        }
        return this.maze[row][col] !== 1; // 1 = wall
    }

    /**
     * Get valid neighbors for pathfinding
     */
    getNeighbors(row: number, col: number): { row: number; col: number }[] {
        const neighbors = [];
        const directions = [
            { row: -1, col: 0 }, // up
            { row: 1, col: 0 }, // down
            { row: 0, col: -1 }, // left
            { row: 0, col: 1 }, // right
        ];

        for (const dir of directions) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;

            if (this.isWalkable(newRow, newCol)) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }

        return neighbors;
    }

    /**
     * BFS pathfinding with Manhattan distance heuristic (A* style)
     */
    findPathBFS(
        start: { row: number; col: number },
        target: { row: number; col: number }
    ): { row: number; col: number }[] {
        if (
            !this.isWalkable(start.row, start.col) ||
            !this.isWalkable(target.row, target.col)
        ) {
            return [];
        }

        // If already at target, return path with just start position
        if (start.row === target.row && start.col === target.col) {
            return [start];
        }

        const openSet: Array<{
            pos: { row: number; col: number };
            gCost: number; // Distance from start
            hCost: number; // Heuristic distance to target
            fCost: number; // gCost + hCost
            parent: { row: number; col: number } | null;
        }> = [];

        const closedSet = new Set<string>();
        const parentMap = new Map<
            string,
            { row: number; col: number } | null
        >();
        const gScores = new Map<string, number>();

        const startKey = `${start.row},${start.col}`;
        const startNode = {
            pos: start,
            gCost: 0,
            hCost: this.manhattanDistance(start, target),
            fCost: 0,
            parent: null,
        };
        startNode.fCost = startNode.gCost + startNode.hCost;

        openSet.push(startNode);
        gScores.set(startKey, 0);
        parentMap.set(startKey, null);

        while (openSet.length > 0) {
            // Sort by fCost (A* heuristic), then by hCost for tie-breaking
            openSet.sort((a, b) => {
                if (a.fCost !== b.fCost) return a.fCost - b.fCost;
                return a.hCost - b.hCost;
            });

            const current = openSet.shift()!;
            const currentKey = `${current.pos.row},${current.pos.col}`;

            // Skip if already processed
            if (closedSet.has(currentKey)) {
                continue;
            }

            closedSet.add(currentKey);

            // Check if we reached the target
            if (
                current.pos.row === target.row &&
                current.pos.col === target.col
            ) {
                // Reconstruct path using parent map
                const path: { row: number; col: number }[] = [];
                let currentPos = current.pos;

                while (currentPos) {
                    path.unshift(currentPos);
                    const currentPosKey = `${currentPos.row},${currentPos.col}`;
                    currentPos = parentMap.get(currentPosKey)!;

                    // Prevent infinite loops
                    if (path.length > 50) break;
                }

                return path;
            }

            // Explore neighbors
            const neighbors = this.getNeighbors(
                current.pos.row,
                current.pos.col
            );

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;

                if (closedSet.has(neighborKey)) {
                    continue;
                }

                const tentativeGCost = current.gCost + 1;
                const existingGCost = gScores.get(neighborKey);

                // If this path to neighbor is better than any previous one
                if (
                    existingGCost === undefined ||
                    tentativeGCost < existingGCost
                ) {
                    gScores.set(neighborKey, tentativeGCost);
                    parentMap.set(neighborKey, current.pos);

                    const hCost = this.manhattanDistance(neighbor, target);
                    const neighborNode = {
                        pos: neighbor,
                        gCost: tentativeGCost,
                        hCost: hCost,
                        fCost: tentativeGCost + hCost,
                        parent: current.pos,
                    };

                    // Remove any existing node with same position but worse cost
                    const existingIndex = openSet.findIndex(
                        (n) =>
                            n.pos.row === neighbor.row &&
                            n.pos.col === neighbor.col
                    );
                    if (existingIndex !== -1) {
                        openSet.splice(existingIndex, 1);
                    }

                    openSet.push(neighborNode);
                }
            }

            // Limit search depth for performance (prevent infinite loops)
            if (closedSet.size > 150) {
                break;
            }
        }

        return []; // No path found
    }

    /**
     * Get target position for each ghost based on their personality
     */
    getGhostTarget(
        ghost: any,
        ghostIndex: number
    ): { row: number; col: number } {
        const pacmanPos = this.worldToGrid(this.pacman.x, this.pacman.y);
        const ghostPos = this.worldToGrid(ghost.x, ghost.y);
        const mode = this.ghostModes[ghost.getData("id")] || "chase";

        switch (mode) {
            case "scatter":
                return this.scatterCorners[ghostIndex];

            case "frightened":
                // Run away from Pac-Man
                const directions = [
                    { row: -5, col: -5 },
                    { row: -5, col: 5 },
                    { row: 5, col: -5 },
                    { row: 5, col: 5 },
                ];
                const fleeDirection = directions[ghostIndex];
                return {
                    row: Math.max(
                        0,
                        Math.min(
                            this.maze.length - 1,
                            pacmanPos.row + fleeDirection.row
                        )
                    ),
                    col: Math.max(
                        0,
                        Math.min(
                            this.maze[0].length - 1,
                            pacmanPos.col + fleeDirection.col
                        )
                    ),
                };

            case "chase":
            default:
                switch (ghostIndex) {
                    case 0: // Red Ghost (Blinky) - Direct chase
                        return pacmanPos;

                    case 1: // Pink Ghost (Pinky) - Ambush 4 tiles ahead
                        const pacmanDir = this.pacmanDirection;
                        let ambushTarget = { ...pacmanPos };

                        switch (pacmanDir) {
                            case "up":
                                ambushTarget.row -= 4;
                                break;
                            case "down":
                                ambushTarget.row += 4;
                                break;
                            case "left":
                                ambushTarget.col -= 4;
                                break;
                            case "right":
                                ambushTarget.col += 4;
                                break;
                        }

                        return {
                            row: Math.max(
                                0,
                                Math.min(this.maze.length - 1, ambushTarget.row)
                            ),
                            col: Math.max(
                                0,
                                Math.min(
                                    this.maze[0].length - 1,
                                    ambushTarget.col
                                )
                            ),
                        };

                    case 2: // Blue Ghost (Inky) - Complex targeting
                        const redGhost = this.ghosts.children.entries[0] as any;
                        if (redGhost) {
                            const redPos = this.worldToGrid(
                                redGhost.x,
                                redGhost.y
                            );
                            const vectorRow = pacmanPos.row - redPos.row;
                            const vectorCol = pacmanPos.col - redPos.col;
                            return {
                                row: Math.max(
                                    0,
                                    Math.min(
                                        this.maze.length - 1,
                                        pacmanPos.row + vectorRow
                                    )
                                ),
                                col: Math.max(
                                    0,
                                    Math.min(
                                        this.maze[0].length - 1,
                                        pacmanPos.col + vectorCol
                                    )
                                ),
                            };
                        }
                        return pacmanPos;

                    case 3: // Orange Ghost (Clyde) - Chase when far, scatter when close
                        const distance = this.manhattanDistance(
                            ghostPos,
                            pacmanPos
                        );
                        if (distance > 8) {
                            return pacmanPos; // Chase when far
                        } else {
                            return this.scatterCorners[3]; // Scatter when close
                        }

                    default:
                        return pacmanPos;
                }
        }
    }

    /**
     * Get the best direction for a ghost to move toward its target using BFS pathfinding
     */
    getGhostDirection(ghost: any, ghostIndex: number): string {
        const ghostPos = this.worldToGrid(ghost.x, ghost.y);
        const target = this.getGhostTarget(ghost, ghostIndex);
        const currentDirection = ghost.getData("direction") || "up";

        // Use BFS pathfinding to find the optimal path
        const path = this.findPathBFS(ghostPos, target);

        if (path.length > 1) {
            // Get the next step in the path (index 1, since index 0 is current position)
            const nextStep = path[1];
            const rowDiff = nextStep.row - ghostPos.row;
            const colDiff = nextStep.col - ghostPos.col;

            // Convert grid difference to direction
            if (rowDiff < 0) return "up";
            if (rowDiff > 0) return "down";
            if (colDiff < 0) return "left";
            if (colDiff > 0) return "right";
        }

        // Fallback: if no path found, use simple directional movement
        const rowDiff = target.row - ghostPos.row;
        const colDiff = target.col - ghostPos.col;

        // Prioritize movement based on larger distance
        const possibleDirections = [];

        if (Math.abs(rowDiff) > Math.abs(colDiff)) {
            // Prioritize vertical movement
            if (rowDiff < 0) possibleDirections.push("up");
            if (rowDiff > 0) possibleDirections.push("down");
            if (colDiff < 0) possibleDirections.push("left");
            if (colDiff > 0) possibleDirections.push("right");
        } else {
            // Prioritize horizontal movement
            if (colDiff < 0) possibleDirections.push("left");
            if (colDiff > 0) possibleDirections.push("right");
            if (rowDiff < 0) possibleDirections.push("up");
            if (rowDiff > 0) possibleDirections.push("down");
        }

        // Check which directions are valid (not blocked by walls)
        const validDirections = [];
        for (const dir of possibleDirections) {
            const testPos = this.getNextPosition(ghostPos, dir);
            if (this.isWalkable(testPos.row, testPos.col)) {
                validDirections.push(dir);
            }
        }

        // If we have valid directions, use the first one (highest priority)
        if (validDirections.length > 0) {
            // Add some randomness to prevent predictable patterns (only for fallback)
            if (Math.random() < 0.05 && validDirections.length > 1) {
                // 5% chance to pick a random valid direction instead of the optimal one
                return validDirections[
                    Math.floor(Math.random() * validDirections.length)
                ];
            }
            return validDirections[0];
        }

        // Last resort: try all directions if target direction is blocked
        const allDirections = ["up", "down", "left", "right"];
        for (const dir of allDirections) {
            const testPos = this.getNextPosition(ghostPos, dir);
            if (this.isWalkable(testPos.row, testPos.col)) {
                return dir;
            }
        }

        // Final fallback - return current direction
        return currentDirection;
    }

    /**
     * Get the next position based on current position and direction
     */
    getNextPosition(
        pos: { row: number; col: number },
        direction: string
    ): { row: number; col: number } {
        switch (direction) {
            case "up":
                return { row: pos.row - 1, col: pos.col };
            case "down":
                return { row: pos.row + 1, col: pos.col };
            case "left":
                return { row: pos.row, col: pos.col - 1 };
            case "right":
                return { row: pos.row, col: pos.col + 1 };
            default:
                return pos;
        }
    }

    /**
     * Get the next grid position for a ghost based on direction
     */
    getNextGridPosition(
        ghost: any,
        direction: string
    ): { x: number; y: number } | null {
        const currentPos = this.worldToGrid(ghost.x, ghost.y);
        const nextPos = this.getNextPosition(currentPos, direction);

        // Check if the next position is walkable
        if (this.isWalkable(nextPos.row, nextPos.col)) {
            const worldPos = this.gridToWorld(nextPos.row, nextPos.col);
            return worldPos;
        }

        return null; // Can't move in that direction
    }

    /**
     * Get the next grid position for Pac-Man based on direction
     */
    getPacManNextGridPosition(
        direction: string
    ): { x: number; y: number } | null {
        const currentPos = this.worldToGrid(this.pacman.x, this.pacman.y);
        const nextPos = this.getNextPosition(currentPos, direction);

        // Check if the next position is walkable (not a wall)
        if (this.isWalkable(nextPos.row, nextPos.col)) {
            const worldPos = this.gridToWorld(nextPos.row, nextPos.col);
            return worldPos;
        }

        return null; // Can't move in that direction
    }

    changeScene() {
        this.scene.start("MainMenu");
    }
}
