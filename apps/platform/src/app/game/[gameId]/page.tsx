"use client";

import { GameEngine } from "@/game-logic/game-engine";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { GameGetResponseBody } from "@/api-interface/games/get-response-body";
import { GameStatus } from "@/game-logic/game-status";
import { Game } from "@kiro-rts/game";

/**
 * ゲームデータを取得する関数（Kiroが生成）
 */
const fetchGameData = async (gameId: string): Promise<GameGetResponseBody> => {
  const response = await fetch(`/api/games/${gameId}`);

  if (!response.ok) {
    throw new Error("ゲームデータの取得に失敗しました");
  }

  return response.json();
};

/**
 * ゲーム終了処理（Kiroが生成）
 */
const finishGame = async (
  gameId: string,
  isCompleted: boolean,
  consumedToken: number,
): Promise<void> => {
  const response = await fetch(`/api/games/${gameId}/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isCompleted,
      consumedToken,
    }),
  });

  if (!response.ok) {
    throw new Error("ゲーム終了処理に失敗しました");
  }
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [prompt, setPrompt] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const [gameData, setGameData] = useState<GameGetResponseBody | null>(null);
  const [selectedCsvPath, setSelectedCsvPath] = useState<string>("/game-assets/config/enemy-waves.csv");

  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true);
        const fetchedGameData = await fetchGameData(gameId);
        setGameData(fetchedGameData);

        // ゲームが既に終了している場合は初期化しない
        if (fetchedGameData.isFinished) {
          return;
        }

        const stageId = fetchedGameData.stageId!;

        const engine = await GameEngine.createInstance(stageId);
        setGameEngine(engine);
        setGameStatus(engine.getGameStatus());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "ゲームの初期化に失敗しました",
        );
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      initializeGame();
    }
  }, [gameId]);

  const countTokens = async (text: string) => {
    if (!gameEngine) {
      return;
    }

    try {
      const promptTokenCount = await gameEngine.countTokens(text);
      setTokenCount(promptTokenCount);
    } catch (error) {
      console.error("トークンカウントエラー:", error);
    }
  };

  /**
   * プロンプトを送信した時の処理
   * @returns
   */
  const handleSubmit = async () => {
    if (!prompt.trim() || !gameEngine) {
      return;
    }

    try {
      await gameEngine.order(prompt);
      // ゲーム状況を更新
      setGameEngine(gameEngine);
      setGameStatus(gameEngine.getGameStatus());
      // プロンプトをクリア
      setPrompt("");
      countTokens("");
    } catch (error) {
      console.error("プロンプト処理エラー:", error);
    }
  };

  /**
   * ゲーム成功処理（Kiroが生成）
   */
  const handleSuccess = async () => {
    try {
      await finishGame(gameId, true, gameEngine!.tokenModule.consumedToken);
      router.push(`/game/${gameId}/result`);
    } catch (error) {
      console.error("ゲーム成功処理エラー:", error);
      alert("ゲーム終了処理に失敗しました");
    }
  };

  /**
   * ゲーム失敗処理（Kiroが生成）
   */
  const handleFailure = async () => {
    try {
      const consumedToken = gameStatus?.stage?.maxTokens || 100; // デモ用の値
      await finishGame(gameId, false, consumedToken);
      router.push(`/game/${gameId}/result`);
    } catch (error) {
      console.error("ゲーム失敗処理エラー:", error);
      alert("ゲーム終了処理に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">ゲームを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  // ゲームが既に終了している場合のエラーページ（Kiroが生成）
  if (gameData && gameData.isFinished) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        {/* 和風装飾パターン */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full bg-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.4'%3E%3Cpath d='M40 40c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm20 0c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* エラーメッセージ */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-red-600 mb-4 drop-shadow-lg">
              ⚠️ ゲーム終了済み ⚠️
            </h1>
            <div className="text-xl md:text-2xl text-gray-700">
              このゲームは既に終了しています
            </div>
          </div>

          {/* エラーカード */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full border-4 border-red-200">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🏁</div>
              <div className="text-2xl font-bold text-red-800 mb-4">
                ゲーム終了
              </div>
              <div className="text-lg text-gray-600 mb-6">
                このゲームは既に終了しているため、
                <br />
                プレイすることはできません。
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-blue-700 font-semibold">
                  結果を確認するか、新しいゲームを開始してください
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push(`/game/${gameId}/result`)}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                📊 結果を見る
              </button>

              <button
                onClick={() => router.push("/")}
                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🏠 ホームに戻る
              </button>

              <button
                onClick={() => router.push("/player/selection")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🎮 新しいゲーム
              </button>
            </div>
          </div>

          {/* 装飾的な要素（終了テーマ） */}
          <div className="absolute top-10 left-10 text-3xl animate-float">
            🏁
          </div>
          <div className="absolute top-20 right-16 text-3xl animate-float delay-1000">
            🎯
          </div>
          <div className="absolute bottom-20 left-20 text-3xl animate-float delay-500">
            📊
          </div>
          <div className="absolute bottom-16 right-12 text-3xl animate-float delay-1500">
            🏆
          </div>
        </div>

        {/* カスタムアニメーション */}
        <style jsx>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-15px) rotate(5deg);
            }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  if (!gameEngine || !gameStatus) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左側3/4: ゲーム状況表示 */}
      <div className="w-3/4 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow p-6">
          {/* 上部: 成功・失敗ボタン */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleSuccess}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              ✅ ゲーム成功
            </button>
            <button
              onClick={handleFailure}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              ❌ ゲーム失敗
            </button>
          </div>

          {/* CSV選択UI */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">敵ウェーブ設定を選択</h2>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setSelectedCsvPath("/game-assets/config/enemy-waves.csv")}
                className={`px-4 py-2 rounded ${selectedCsvPath === "/game-assets/config/enemy-waves.csv" ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-300 hover:bg-gray-500"}`}
              >
                通常
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedCsvPath("/game-assets/config/enemy-waves-hard.csv")}
                className={`px-4 py-2 rounded ${selectedCsvPath === "/game-assets/config/enemy-waves-hard.csv" ? "bg-red-600 text-white" : "bg-gray-600 text-gray-300 hover:bg-gray-500"}`}
              >
                ハード
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedCsvPath("/game-assets/config/enemy-waves-test.csv")}
                className={`px-4 py-2 rounded ${selectedCsvPath === "/game-assets/config/enemy-waves-test.csv" ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300 hover:bg-gray-500"}`}
              >
                テスト
              </button>
            </div>
            <p className="text-gray-600 text-sm mt-2">現在選択中: {selectedCsvPath}</p>
          </div>

          {/* ゲームコンポーネント */}
          <Game csvFilePath={selectedCsvPath} />
        </div>
      </div>

      {/* 右側1/4: プロンプト入力欄 */}
      <div className="w-1/4 p-4">
        <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
          <h2 className="text-xl font-semibold mb-4">コマンド入力</h2>

          <div className="flex-1 flex flex-col">
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                countTokens(e.target.value);
              }}
              placeholder="ゲームコマンドを入力してください..."
              className="flex-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <p>入力のトークン数：{tokenCount}</p>
            <p>
              使用可能トークン数：{gameEngine.tokenModule.remainingTokens} /{" "}
              {gameEngine.stage.maxTokens}
            </p>

            <button
              onClick={handleSubmit}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
