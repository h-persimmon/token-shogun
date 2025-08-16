import { NextRequest, NextResponse } from "next/server";
import { GameService } from "./game.service";
import { GamesPostRequestBody } from "@/api-interface/games/post-request-body";
import { withErrorHandling } from "../util/error/with-error-handling";
import { GamesPostResponseBody } from "@/api-interface/games/post-response-body";
import { GamesGetResponseBody } from "@/api-interface/games/get-response-body";
import { SessionService } from "../util/session/session.service";
import { PlayerService } from "../players/player.service";

/**
 * POSTリクエストの処理
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const gameService = GameService.getInstance();
  const playerService = PlayerService.getInstance();
  const sessionService = SessionService.getInstance();
  const requestBody: GamesPostRequestBody = await request.json();

  const { stageId } = requestBody;
  const currentPlayerId = await sessionService.getCurrentPlayerIdOrThrow();
  const currentPlayer = await playerService.findByIdOrFail(currentPlayerId);
  const game = await gameService.create(stageId, currentPlayer.id);

  const responseBody: GamesPostResponseBody = { gameId: game.id };
  return NextResponse.json(responseBody);
});

/**
 * GETリクエストの処理
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const gameService = GameService.getInstance();
  const playerId = request.nextUrl.searchParams.get("playerId");
  const isCleared = request.nextUrl.searchParams.get("isCleared");

  let responseBody: GamesGetResponseBody;
  if (playerId === null) {
    responseBody = await gameService.findAll();
  } else if (isCleared) {
    responseBody = await gameService.findClearedGamesByPlayerId(playerId);
  } else {
    responseBody = await gameService.findByPlayerId(playerId);
  }

  return NextResponse.json(responseBody);
});
