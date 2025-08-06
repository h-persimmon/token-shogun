import { DIFFICULTY } from "@/constants";

/**
 * 難易度  
 * "easy" | "normal" | "hard"
 */
export type Difficulty = typeof DIFFICULTY [keyof typeof DIFFICULTY];
