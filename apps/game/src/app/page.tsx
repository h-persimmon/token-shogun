"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";

const Game = dynamic(() => import("./components/game"), {
  ssr: false, // サーバーサイドレンダリングを無効化
  loading: () => <div>ゲームを読み込み中...</div>,
});

// Next.js Page Component
export default function PhaserGamePage() {
  const [selectedCsvPath, setSelectedCsvPath] = useState<string>(
    "/config/enemy-waves.csv",
  );
  const [gameKey, setGameKey] = useState(0); // ゲームを再作成するためのキー

  const handleCsvChange = (csvPath: string) => {
    setSelectedCsvPath(csvPath);
    setGameKey((prev) => prev + 1); // ゲームを再作成
  };

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

      {/* CSV選択UI */}
      <div className="mb-6 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-3">
          敵ウェーブ設定を選択
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleCsvChange("/config/enemy-waves.csv")}
            className={`px-4 py-2 rounded ${
              selectedCsvPath === "/config/enemy-waves.csv"
                ? "bg-blue-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}
          >
            通常
          </button>
          <button
            type="button"
            onClick={() => handleCsvChange("/config/enemy-waves-hard.csv")}
            className={`px-4 py-2 rounded ${
              selectedCsvPath === "/config/enemy-waves-hard.csv"
                ? "bg-red-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}
          >
            ハード
          </button>
          <button
            type="button"
            onClick={() => handleCsvChange("/config/enemy-waves-test.csv")}
            className={`px-4 py-2 rounded ${
              selectedCsvPath === "/config/enemy-waves-test.csv"
                ? "bg-green-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}
          >
            テスト
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          現在選択中: {selectedCsvPath}
        </p>
      </div>

      <Suspense fallback={<div>ゲームを読み込み中...</div>}>
        <Game key={gameKey} csvFilePath={selectedCsvPath} />
      </Suspense>
    </div>
  );
}
