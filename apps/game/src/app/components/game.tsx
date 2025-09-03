"use client";
import { useEffect, useRef, useState } from "react";
import { GameScene } from "@/lib/game/scene/rts-scene";

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
    <div className="flex flex-col items-center min-h-screen bg-gray-900 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Next.js + Phaser ECS Game
        </h1>
        <p className="text-gray-300">
          Entity Component Systemを使用した戦略ゲーム
        </p>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <div id="phaser-game" />
      </div>

      <div className="mt-6 max-w-2xl text-center">
        <h2 className="text-xl font-semibold text-white mb-3">操作方法</h2>
        <div className="text-gray-300 space-y-2">
          <p>• ユニットをクリックして詳細情報を表示</p>
          <p>• 緑色の四角：味方ユニット（HP: 100, 攻撃力: 25）</p>
          <p>• 赤色の四角：敵ユニット（HP: 80, 攻撃力: 20）</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="bg-gray-800 rounded-lg p-4 text-gray-300 max-w-md">
          <h3 className="font-semibold text-white mb-2">技術スタック</h3>
          <p className="text-sm">
            Next.js + TypeScript + Phaser + Entity Component System
          </p>
        </div>
      </div>
    </div>
  );
}
