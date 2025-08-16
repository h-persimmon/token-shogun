"use client";

import { PlayersGetResponseBody } from "@/api-interface/players/get/response-body";
import { useEffect, useState } from "react";

/**
 * プレイヤー情報を表すインターフェース（このページでのみ使用）
 */
interface Player {
  id: string;
  name: string;
}

/**
 * プレイヤー選択ページ（Kiroが生成）
 */
export default function PlayerSelectionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  /**
   * プレイヤーデータを取得する関数（Kiroが生成）
   */
  const fetchPlayers = async () => {
    try {
      const response = await fetch("/api/players");
      if (response.ok) {
        const body: PlayersGetResponseBody = await response.json();
        setPlayers(body.map((p) => ({ ...p })));
      }
    } catch (error) {
      console.error("プレイヤーデータの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  /**
   * プレイヤー選択時の処理（Kiroが生成）
   */
  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayer(playerId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-800 font-medium">
            プレイヤー情報を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* タイトル */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-900 mb-4 tracking-wider">
            プレイヤー選択
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-600 to-red-600 mx-auto"></div>
        </div>

        {/* プレイヤーカード一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {players.map((player) => (
            <div
              key={player.id}
              onClick={() => handlePlayerSelect(player.id!)}
              className={`
                relative cursor-pointer transform transition-all duration-300 hover:scale-105
                ${
                  selectedPlayer === player.id
                    ? "ring-4 ring-amber-500 shadow-2xl"
                    : "hover:shadow-xl"
                }
              `}
            >
              {/* カード本体 */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg overflow-hidden border-2 border-amber-200 shadow-lg">
                {/* 装飾的な上部 */}
                <div className="h-2 bg-gradient-to-r from-amber-600 via-red-600 to-amber-600"></div>

                {/* プレイヤー情報 */}
                <div className="p-6">
                  {/* アバター部分 */}
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {player.name?.charAt(0) || "?"}
                    </span>
                  </div>

                  {/* 名前 */}
                  <h3 className="text-xl font-bold text-amber-900 text-center mb-2 tracking-wide">
                    {player.name || "名無し"}
                  </h3>

                  {/* ID */}
                  <p className="text-sm text-amber-700 text-center opacity-75">
                    ID: {player.id}
                  </p>
                </div>

                {/* 選択インジケーター */}
                {selectedPlayer === player.id && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* ホバー効果 */}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-600/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* プレイヤーが存在しない場合 */}
        {players.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏯</div>
            <h3 className="text-2xl font-bold text-amber-900 mb-2">
              プレイヤーが見つかりません
            </h3>
            <p className="text-amber-700">
              まずはプレイヤーを登録してください。
            </p>
          </div>
        )}

        {/* 選択確定ボタン */}
        {selectedPlayer && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
            <button className="bg-gradient-to-r from-amber-600 to-red-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              ステージ選択へ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
