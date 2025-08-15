"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// （Kiroが生成）
const handleGameStart = (router: any) => {
  router.push("/stages");
};

export default function Home() {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className="relative w-full h-screen bg-gradient-to-b from-amber-50 via-orange-100 to-red-200 cursor-pointer overflow-hidden"
      onClick={() => handleGameStart(router)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* 背景の和風パターン */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* メインコンテンツ */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center h-full transition-transform duration-150 ${isPressed ? "scale-95" : "scale-100"}`}
      >
        {/* タイトルロゴエリア */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-8xl font-bold text-amber-800 mb-4 drop-shadow-lg">
            桜戦記
          </h1>
          <div className="text-2xl md:text-3xl text-red-700 font-medium tracking-wider">
            〜 SAKURA SENKI 〜
          </div>
        </div>

        {/* キャラクター画像エリア（代替） */}
        <div className="relative mb-8">
          <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-pink-200 to-red-300 rounded-full flex items-center justify-center shadow-2xl border-4 border-amber-600">
            <div className="text-6xl">🌸</div>
          </div>

          {/* 装飾的な桜の花びら */}
          <div className="absolute -top-4 -left-4 text-4xl animate-pulse">
            🌸
          </div>
          <div className="absolute -top-2 -right-6 text-3xl animate-pulse delay-300">
            🌸
          </div>
          <div className="absolute -bottom-6 -left-2 text-3xl animate-pulse delay-700">
            🌸
          </div>
          <div className="absolute -bottom-4 -right-4 text-4xl animate-pulse delay-500">
            🌸
          </div>
        </div>

        {/* クリック案内 */}
        <div className="text-center">
          <div className="text-xl md:text-2xl text-amber-800 font-medium mb-2 animate-bounce">
            画面をタップして開始
          </div>
          <div className="text-lg text-red-600">TOUCH TO START</div>
        </div>

        {/* 装飾的な要素 */}
        <div className="absolute top-10 left-10 text-2xl animate-float">🏯</div>
        <div className="absolute top-20 right-16 text-2xl animate-float delay-1000">
          ⛩️
        </div>
        <div className="absolute bottom-20 left-20 text-2xl animate-float delay-500">
          🎋
        </div>
        <div className="absolute bottom-16 right-12 text-2xl animate-float delay-1500">
          🗾
        </div>
      </div>

      {/* カスタムアニメーション */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
