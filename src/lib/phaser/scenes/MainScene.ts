import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Sprite;

  constructor() {
    super("MainScene");
  }

  preload() {
    this.load.setBaseURL("https://labs.phaser.io");
    this.load.image(
      "logo",
      //   "https://labs.phaser.io/assets/sprites/phaser3-logo.png",
      "assets/sprites/phaser3-logo.png",
    );
  }

  create() {
    const { width, height } = this.scale;
    const leftWidth = width * 0.75;
    const rightX = leftWidth + (width * 0.25) / 2; // 右側エリアの中央

    // 左側にロゴ配置
    this.logo = this.add.sprite(leftWidth / 2, height / 2, "logo");
    this.tweens.add({
      targets: this.logo,
      y: height - 100,
      duration: 1500,
      ease: "Bounce.easeOut",
      yoyo: true,
      repeat: -1,
    });

    // 右側に戻るボタン配置
    const backButton = this.add
      .text(rightX, height / 2, "← Back", {
        fontSize: "24px",
        backgroundColor: "#cc0000",
        padding: { x: 10, y: 5 },
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("MenuScene");
      });

    backButton.on("pointerover", () =>
      backButton.setStyle({ backgroundColor: "#a30000" }),
    );
    backButton.on("pointerout", () =>
      backButton.setStyle({ backgroundColor: "#cc0000" }),
    );

    // （任意）区切り線を描画して視覚的に分ける
    this.add
      .line(0, 0, leftWidth, 0, leftWidth, height, 0xffffff)
      .setOrigin(0, 0);
  }
}
