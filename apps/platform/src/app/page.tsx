"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// （Kiroが生成）
const handleGameStart = (router: any) => {
  router.push("/game");
};

export default function TopPage() {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className="relative w-full h-screen cursor-pointer overflow-hidden"
      onClick={() => handleGameStart(router)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* 背景画像 */}
      <div className="absolute inset-0">
        <img
          src="/img/title/token-shogun.png"
          alt="Fight"
          className="w-full h-full object-cover"
        />
      </div>

      {/* クリック案内 */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className={`text-2xl font-bold text-white drop-shadow-lg transition-transform duration-150 ${isPressed ? "scale-95" : "scale-100"}`}>
          CLICK TO START
        </div>
      </div>
    </div>
  );
}
