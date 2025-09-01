"use client";

import dynamic from "next/dynamic";

const AvoidSsrPhaserGame = dynamic(() => import("@/components/PhaserGame"), {
  ssr: false,
});

export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <h1 className="text-2xl text-white mb-4">Phaser.js Sample</h1>
      <div className="border-4 border-white rounded-lg overflow-hidden">
        <AvoidSsrPhaserGame />
      </div>
    </main>
  );
}
