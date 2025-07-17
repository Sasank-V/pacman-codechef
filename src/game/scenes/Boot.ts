import { Scene } from "phaser";

export class Boot extends Scene {
    constructor() {
        super("Boot");
    }

    preload() {
        // Set background to black immediately
        this.cameras.main.setBackgroundColor("#000000");

        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image("background", "assets/bg.png");
    }

    create() {
        // Set background to black
        this.cameras.main.setBackgroundColor("#000000");
        this.scene.start("Preloader");
    }
}
