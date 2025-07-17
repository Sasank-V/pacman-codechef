import { Scene } from "phaser";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        // Set background to black
        this.cameras.main.setBackgroundColor("#000000");

        // Skip displaying the background image to keep it pure black
        // this.add.image(512, 384, "background");

        // Get the center coordinates of the screen
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        //  A simple progress bar. This is the outline of the bar.
        this.add
            .rectangle(centerX, centerY, 468, 32)
            .setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(centerX - 230, centerY, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on("progress", (progress: number) => {
            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + 460 * progress;
        });
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath("assets");

        this.load.image("logo", "logo.png");
        this.load.image("star", "star.png");

        // Load Pac-Man game assets
        this.load.setPath("assets/pacman");

        // Pac-Man sprites
        this.load.image("pacman_0", "pac_man_0.png");
        this.load.image("pacman_1", "pac_man_1.png");
        this.load.image("pacman_2", "pac_man_2.png");
        this.load.image("pacman_3", "pac_man_3.png");
        this.load.image("pacman_4", "pac_man_4.png");

        // Death animation
        this.load.image("pacdeath_0", "pacdeath_0.png");
        this.load.image("pacdeath_1", "pacdeath_1.png");
        this.load.image("pacdeath_2", "pacdeath_2.png");

        // Ghost sprites
        this.load.image("ghost_red", "ghost_red.png");
        this.load.image("ghost_pink", "ghost_pink.png");
        this.load.image("ghost_blue", "ghost_blue.png");
        this.load.image("ghost_orange", "ghost_orange.png");
        this.load.image("ghost_afraid", "ghost_afraid.png");

        // Items
        this.load.image("pill", "pill.png");
        this.load.image("power_pill", "power_pill.png");
        this.load.image("cherry", "cherry.png");

        // Load sound effects
        this.load.setPath("assets/sounds");

        // Game sounds
        this.load.audio("start", "start.wav");
        this.load.audio("credit", "credit.wav");
        this.load.audio("intermission", "intermission.wav");

        // Pac-Man sounds
        this.load.audio("eat_dot_0", "eat_dot_0.wav");
        this.load.audio("eat_dot_1", "eat_dot_1.wav");
        this.load.audio("eat_fruit", "eat_fruit.wav");
        this.load.audio("eat_ghost", "eat_ghost.wav");
        this.load.audio("death_0", "death_0.wav");
        this.load.audio("death_1", "death_1.wav");
        this.load.audio("extend", "extend.wav");

        // Ghost sounds
        this.load.audio("eyes", "eyes.wav");
        this.load.audio("eyes_firstloop", "eyes_firstloop.wav");
        this.load.audio("fright", "fright.wav");
        this.load.audio("fright_firstloop", "fright_firstloop.wav");

        // Siren sounds (different levels)
        this.load.audio("siren0", "siren0.wav");
        this.load.audio("siren0_firstloop", "siren0_firstloop.wav");
        this.load.audio("siren1", "siren1.wav");
        this.load.audio("siren1_firstloop", "siren1_firstloop.wav");
        this.load.audio("siren2", "siren2.wav");
        this.load.audio("siren2_firstloop", "siren2_firstloop.wav");
        this.load.audio("siren3", "siren3.wav");
        this.load.audio("siren3_firstloop", "siren3_firstloop.wav");
        this.load.audio("siren4", "siren4.wav");
        this.load.audio("siren4_firstloop", "siren4_firstloop.wav");
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start("MainMenu");
    }
}
