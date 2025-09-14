"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameGetResponseBody } from "@/api-interface/games/get-response-body";

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
 * ホームに戻る処理（Kiroが生成）
 */
const handleBackToHome = (router: any) => {
  router.push("/");
};

export default function GameResultPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [gameData, setGameData] = useState<GameGetResponseBody | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      fetchGameData(gameId)
        .then(setGameData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl text-amber-800 animate-pulse">
          読み込み中...
        </div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-2xl text-red-600 mb-4">エラーが発生しました</div>
        <div className="text-lg text-gray-600 mb-8">{error}</div>
        <button
          onClick={() => handleBackToHome(router)}
          className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  // ゲームが正常に終了していない場合のエラーページ（Kiroが生成）
  if (!gameData.isFinished) {
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
              ⚠️ 不正なアクセス ⚠️
            </h1>
            <div className="text-xl md:text-2xl text-gray-700">
              ゲームが正常に終了していません
            </div>
          </div>

          {/* エラーカード */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full border-4 border-red-200">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🚫</div>
              <div className="text-2xl font-bold text-red-800 mb-4">
                アクセスエラー
              </div>
              <div className="text-lg text-gray-600 mb-6">
                このゲームはまだ終了していないか、
                <br />
                不正な方法でアクセスされました。
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <div className="text-red-700 font-semibold">
                  正しい手順でゲームをプレイしてください
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleBackToHome(router)}
                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🏠 ホームに戻る
              </button>

              <button
                onClick={() => router.push("/player/selection")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🎮 新しいゲームを開始
              </button>
            </div>
          </div>

          {/* 装飾的な要素（警告テーマ） */}
          <div className="absolute top-10 left-10 text-3xl animate-float">
            ⚠️
          </div>
          <div className="absolute top-20 right-16 text-3xl animate-float delay-1000">
            🚫
          </div>
          <div className="absolute bottom-20 left-20 text-3xl animate-float delay-500">
            ❌
          </div>
          <div className="absolute bottom-16 right-12 text-3xl animate-float delay-1500">
            ⛔
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

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 和風装飾パターン */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Cpath d='M40 40c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm20 0c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
        {/* 結果タイトル */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-amber-800 mb-4 drop-shadow-lg">
            {gameData.isCompleted ? "🎊 勝利 🎊" : "😔 敗北 😔"}
          </h1>
          <div className="text-xl md:text-2xl text-gray-700">
            {gameData.isCompleted
              ? "おめでとうございます！"
              : "また挑戦してください"}
          </div>
        </div>

        {/* 結果カード */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full border-4 border-amber-200">
          {/* プレイヤー情報 */}
          <div className="text-center mb-8">
            <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              🎌 {gameData.player.name} 🎌
            </div>
            <div className="text-lg text-gray-600">プレイヤー</div>
          </div>

          {/* ゲーム詳細 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
              <div className="text-center">
                <div className="text-3xl mb-2">🏯</div>
                <div className="text-lg font-semibold text-amber-800 mb-1">
                  ステージ
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {gameData.stageId}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-200">
              <div className="text-center">
                <div className="text-3xl mb-2">🪙</div>
                <div className="text-lg font-semibold text-red-800 mb-1">
                  消費トークン
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {gameData.consumedToken}
                </div>
              </div>
            </div>
          </div>

          {/* 結果ステータス */}
          <div
            className={`text-center p-6 rounded-xl border-2 mb-8 ${
              gameData.isCompleted
                ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                : "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200"
            }`}
          >
            <div className="text-4xl mb-2">
              {gameData.isCompleted ? "✅" : "❌"}
            </div>
            <div
              className={`text-xl font-bold ${
                gameData.isCompleted ? "text-green-800" : "text-gray-800"
              }`}
            >
              {gameData.isCompleted ? "クリア成功" : "クリア失敗"}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleBackToHome(router)}
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🏠 ホームに戻る
            </button>

            <button
              onClick={() => router.push("/player/selection")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🎮 もう一度プレイ
            </button>
          </div>
        </div>

        {/* 装飾的な要素 */}
        <div className="absolute top-10 left-10 text-3xl animate-float">🌸</div>
        <div className="absolute top-20 right-16 text-3xl animate-float delay-1000">
          🌸
        </div>
        <div className="absolute bottom-20 left-20 text-3xl animate-float delay-500">
          🍃
        </div>
        <div className="absolute bottom-16 right-12 text-3xl animate-float delay-1500">
          🍃
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
