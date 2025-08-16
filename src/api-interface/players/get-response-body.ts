import { Player } from "@/app/api/players/player.entity";

/**
 * /playersにGETした際のレスポンスボディの型
 */
export type PlayersGetResponseBody = Player[];

/**
 * /players/[playerId]にGETした際のレスポンスボディの型
 */
export type PlayerGetResponseBody = Player;
