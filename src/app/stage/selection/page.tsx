"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { GamesPostRequestBody } from "../../../api-interface/games/post-request-body";
import type { GamesPostResponseBody } from "../../../api-interface/games/post-response-body";
import { stageList } from "@/game-logic/stage/list";
import { Stage } from "@/game-logic/stage/interface";

// （Kiroが生成）
const createGameSession = async (stageId: string): Promise<string> => {
  const requestBody: GamesPostRequestBody = { stageId };

  const response = await fetch("/api/games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error("ゲームセッションの作成に失敗しました");
  }

  const responseBody: GamesPostResponseBody = await response.json();
  return responseBody.gameId;
};

// （Kiroが生成）
const handleStageSelect = async (
  stage: Stage,
  router: any,
  setLoading: any,
) => {
  setLoading(stage.id);
  try {
    const gameId = await createGameSession(stage.id);
    router.push(`/game/${gameId}`);
  } catch (error) {
    console.error("ステージ開始エラー:", error);
    alert("ステージの開始に失敗しました");
  } finally {
    setLoading(null);
  }
};

export default function StageSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 overflow-hidden">
      {/* 背景マップ */}
      <div className="absolute inset-0">
        {/* 山々の背景 */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-green-200 to-transparent opacity-60"></div>
        <div className="absolute bottom-0 right-0 w-2/3 h-1/2 bg-gradient-to-l from-blue-200 to-transparent opacity-40"></div>

        {/* 装飾的な要素 */}
        <div className="absolute top-10 left-10 text-4xl opacity-30">🏔️</div>
        <div className="absolute top-20 right-20 text-3xl opacity-30">☁️</div>
        <div className="absolute bottom-20 left-1/4 text-3xl opacity-30">
          🌲
        </div>
        <div className="absolute bottom-32 right-1/3 text-3xl opacity-30">
          🌲
        </div>
        <div className="absolute top-1/3 left-1/2 text-2xl opacity-30">🦅</div>
      </div>

      {/* タイトル */}
      <div className="relative z-20 text-center pt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-800 mb-2 drop-shadow-lg">
          ステージ選択
        </h1>
        <div className="text-lg text-red-700">冒険の舞台を選んでください</div>
      </div>

      {/* ステージマップ */}
      <div className="relative z-10 w-full h-full">
        {stageList.map((stage) => (
          <div
            key={stage.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110 hover:z-30 ${loading === stage.id ? "animate-pulse" : ""}`}
            style={{
              left: `${stage.mapPosition.x}%`,
              top: `${stage.mapPosition.y}%`,
            }}
            onClick={() => handleStageSelect(stage, router, setLoading)}
          >
            {/* ステージアイコン */}
            <div
              className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl md:text-4xl shadow-lg border-4 bg-gradient-to-br from-blue-200 to-purple-300 border-blue-500`}
            >
              🎯
            </div>

            {/* ステージ名 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-center">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium shadow-md bg-white text-amber-800`}
              >
                {stage.name}
              </div>
            </div>

            {/* 接続線（簡易版） */}
            {stage.id === "stage-2" && (
              <div className="absolute top-1/2 -left-32 w-32 h-0.5 bg-amber-600 opacity-60 transform -translate-y-1/2"></div>
            )}
            {stage.id === "stage-3" && (
              <div className="absolute top-1/2 -left-24 w-24 h-0.5 bg-amber-600 opacity-60 transform -translate-y-1/2 rotate-45"></div>
            )}
          </div>
        ))}
      </div>

      {/* 戻るボタン */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 z-20 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-lg"
      >
        ← タイトルに戻る
      </button>

      {/* 説明 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 text-center">
        <div className="bg-white bg-opacity-80 px-4 py-2 rounded-lg shadow-md">
          <div className="text-sm text-gray-700">
            🎯 プレイ可能 | ⭐ クリア済み | 🔒 未開放
          </div>
        </div>
      </div>
    </div>
  );
}
