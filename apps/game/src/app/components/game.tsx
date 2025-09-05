"use client";
import { useEffect, useRef, useState } from "react";
import { GameScene } from "../../lib/game/scene/rts-scene";

// Next.js Page Component
interface GameProps {
  csvFilePath?: string;
}

export default function Game({ csvFilePath }: GameProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!isMounted) return;
    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 32 * 30,
      height: 600,
      backgroundColor: "#2E2E2E",
      scene: new GameScene({ csvFilePath }),
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false,
        },
      },
    };
    if (typeof window !== "undefined" && !gameRef.current) {
      gameRef.current = new Phaser.Game({
        ...gameConfig,
        parent: "phaser-game",
      });
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [isMounted, csvFilePath]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div id="phaser-game" />
    </div>
  );
}
