import type { GameWithPlayer } from "@/app/api/games/game.service";

/**
 * /gamesにGETした際のレスポンスボディの型
 */
export type GamesGetResponseBody = GameWithPlayer[];

/**
 * /games/[gameId]にGETした際のレスポンスボディの型
 */
export type GameGetResponseBody = GameWithPlayer;
