
import { Suspense, useState } from "react";
import Game from "./components/game";

export default function PhaserGamePage() {
  const [selectedCsvPath, setSelectedCsvPath] = useState<string>("/game-assets/config/enemy-waves.csv");
  const [gameKey, setGameKey] = useState(0);

  const handleCsvChange = (csvPath: string) => {
    setSelectedCsvPath(csvPath);
    setGameKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center w-full h-full bg-gray-900 py-8">
      <Suspense fallback={<div>ゲームを読み込み中...</div>}>
        <Game key={gameKey} csvFilePath={selectedCsvPath} />
      </Suspense>
    </div>
  );
}
