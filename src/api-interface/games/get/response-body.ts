import { Game } from "@/app/api/games/game.entity";

/**
 * /gamesにGETした際のレスポンスボディの型
 */
export type GamesGetResponseBody = Game[];

/**
 * /games/[gameId]にGETした際のレスポンスボディの型
 */
export type GameGetResponseBody = Game;
