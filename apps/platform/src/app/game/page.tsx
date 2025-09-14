"use client";

import { Game } from "@kiro-rts/game";
import { Suspense, useState } from "react";
import ChatField from "../components/chat-field";
import LogField from "../components/log-field";

export default function GamePage() {
  const [csvFilePath, setCsvFilePath] = useState<string>(
    "/game-assets/config/enemy-waves.csv",
  );

  return (
    <div className="flex h-screen">
      {/* 左側3/4 */}
      <div className="w-3/4">
        {/* ゲーム画面 */}
        <div className="bg-gray-800 p-4">
        {/* <Suspense fallback={<div>ゲームを読み込み中...</div>}> */}
            <Game csvFilePath={csvFilePath} />
        {/* </Suspense> */}
        </div>
        {/* チャット欄 */}
        <ChatField />
      </div>
      {/* 右側1/4 */}
      <div className="w-1/4">
        {/* ログ出力欄 */}
        <LogField />
      </div>
    </div>
  );
}
