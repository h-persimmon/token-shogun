"use client";
import { useEffect, useRef, useState } from "react";
import { GameScene } from "../../lib/game/scene/rts-scene";
import { OrderListener } from "../../lib/game/order-listner";
import { useChannelMessagingReceiver } from "../../lib/hooks/use-channel-messaging-receiver";

// Next.js Page Component
interface GameProps {
  csvFilePath?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'very-hard';
}

export default function Game({ csvFilePath, difficulty = 'easy' }: GameProps) {
  const [isMounted, setIsMounted] = useState(false);
  const orderListenerRef = useRef<OrderListener>(new OrderListener());

  useChannelMessagingReceiver(orderListenerRef.current);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!isMounted) return;
    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 32 * 32,
      height: 500,
      backgroundColor: "#2E2E2E",
      scene: new GameScene({ csvFilePath, difficulty }, orderListenerRef.current),
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
  }, [isMounted, csvFilePath, difficulty]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg relative">
      <div id="phaser-game" />
    </div>
  );
}
