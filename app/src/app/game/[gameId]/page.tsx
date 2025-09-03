"use client";

import { GameEngine } from "@/game-logic/game-engine";
import { useState } from "react";

export default function Page() {
  const stageId = 1; // TODO: パスパラメータから取得するように変更
  const [gameEngine] = useState(new GameEngine(stageId));
  const [gameStatus, setGameStatus] = useState(gameEngine.getGameStatus());
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    try {
      await gameEngine.order(prompt);
      // ゲーム状況を更新
      setGameStatus(gameEngine.getGameStatus());
      // プロンプトをクリア
      setPrompt("");
    } catch (error) {
      console.error("プロンプト処理エラー:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左側3/4: ゲーム状況表示 */}
      <div className="w-3/4 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">ゲーム状況</h1>

          {/* ステージ情報 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">ステージ情報</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p>
                <strong>ID:</strong> {gameStatus.stage.id}
              </p>
              <p>
                <strong>名前:</strong> {gameStatus.stage.name}
              </p>
              <p>
                <strong>難易度:</strong> {gameStatus.stage.difficulty}
              </p>
              <p>
                <strong>フィールドサイズ:</strong>{" "}
                {gameStatus.stage.fieldSize.width} x{" "}
                {gameStatus.stage.fieldSize.height}
              </p>
              <p>
                <strong>最大トークン:</strong> {gameStatus.stage.maxTokens}
              </p>
            </div>
          </div>

          {/* 敵ユニット情報 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              敵ユニット ({gameStatus.enemyUnits.length}体)
            </h2>
            <div className="space-y-4">
              {gameStatus.enemyUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-red-50 border border-red-200 p-4 rounded"
                >
                  <h3 className="font-semibold text-red-800 mb-2">{unit.id}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>ユニットタイプID:</strong> {unit.unitType.id}
                      </p>
                      <p>
                        <strong>名前:</strong> {unit.unitType.name}
                      </p>
                      <p>
                        <strong>陣営:</strong> {unit.unitType.faction}
                      </p>
                      <p>
                        <strong>最大HP:</strong> {unit.unitType.maxHp}
                      </p>
                      <p>
                        <strong>デフォルト速度:</strong>{" "}
                        {unit.unitType.defaultSpeed}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>座標:</strong> ({unit.position.x},{" "}
                        {unit.position.y})
                      </p>
                      <p>
                        <strong>現在HP:</strong> {unit.currentHp}
                      </p>
                      <p>
                        <strong>現在速度:</strong> {unit.currentSpeed}
                      </p>
                      <p>
                        <strong>現在イベント:</strong> {unit.currentEvent.id}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 味方ユニット情報 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              味方ユニット ({gameStatus.allyUnits.length}体)
            </h2>
            <div className="space-y-4">
              {gameStatus.allyUnits.length === 0 ? (
                <p className="text-gray-500">
                  味方ユニットはまだ配置されていません
                </p>
              ) : (
                gameStatus.allyUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-blue-50 border border-blue-200 p-4 rounded"
                  >
                    <h3 className="font-semibold text-blue-800 mb-2">
                      {unit.id}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p>
                          <strong>ユニットタイプID:</strong> {unit.unitType.id}
                        </p>
                        <p>
                          <strong>名前:</strong> {unit.unitType.name}
                        </p>
                        <p>
                          <strong>陣営:</strong> {unit.unitType.faction}
                        </p>
                        <p>
                          <strong>最大HP:</strong> {unit.unitType.maxHp}
                        </p>
                        <p>
                          <strong>デフォルト速度:</strong>{" "}
                          {unit.unitType.defaultSpeed}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>座標:</strong> ({unit.position.x},{" "}
                          {unit.position.y})
                        </p>
                        <p>
                          <strong>現在HP:</strong> {unit.currentHp}
                        </p>
                        <p>
                          <strong>現在速度:</strong> {unit.currentSpeed}
                        </p>
                        <p>
                          <strong>現在イベント:</strong> {unit.currentEvent.id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 右側1/4: プロンプト入力欄 */}
      <div className="w-1/4 p-4">
        <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
          <h2 className="text-xl font-semibold mb-4">コマンド入力</h2>

          <div className="flex-1 flex flex-col">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ゲームコマンドを入力してください..."
              className="flex-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

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
