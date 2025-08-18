import type { Player } from "@prisma/client";

/**
 * /playersにGETした際のレスポンスボディの型
 */
export type PlayersGetResponseBody = Player[];

/**
 * /players/[playerId]にGETした際のレスポンスボディの型
 */
export type PlayerGetResponseBody = Player;
