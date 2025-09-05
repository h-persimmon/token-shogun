"use client";
import dynamic from "next/dynamic";

const Game = dynamic(() => import("@kiro-rts/game").then(mod => mod.Game), { ssr: false });
export { Game };