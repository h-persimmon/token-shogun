import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 50, "Menu Scene", {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const playButton = this.add
      .text(width / 2, height / 2 + 20, "▶ Start Game", {
        fontSize: "24px",
        backgroundColor: "#007acc",
        padding: { x: 10, y: 5 },
        color: "#fff",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("MainScene");
      });

    playButton.on("pointerover", () =>
      playButton.setStyle({ backgroundColor: "#005fa3" }),
    );
    playButton.on("pointerout", () =>
      playButton.setStyle({ backgroundColor: "#007acc" }),
    );
  }
}
