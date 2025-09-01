"use client";

import Phaser from "phaser";
import { useEffect, useRef } from "react";
import { MainScene } from "@/lib/phaser/scenes/MainScene";
import MenuScene from "@/lib/phaser/scenes/MenuScene";

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) {
      return; // 二重初期化防止
    }

    if (containerRef.current) {
      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: containerRef.current,
        backgroundColor: "#1d1d1d",
        scene: [MenuScene, MainScene],
      });
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
