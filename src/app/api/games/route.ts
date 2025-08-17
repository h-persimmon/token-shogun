import { NextRequest, NextResponse } from "next/server";
import { GameService } from "./game.service";
import { GamesPostRequestBody } from "@/api-interface/games/post-request-body";
import { withErrorHandling } from "../util/error/with-error-handling";
import { GamesPostResponseBody } from "@/api-interface/games/post-response-body";
import { GamesGetResponseBody } from "@/api-interface/games/get-response-body";
import { SessionService } from "../util/session/session.service";

/**
 * POSTリクエストの処理
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const gameService = GameService.getInstance();
  const sessionService = SessionService.getInstance();
  const requestBody: GamesPostRequestBody = await request.json();

  const { stageId } = requestBody;
  const currentPlayer = await sessionService.getCurrentPlayerOrThrow();
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
  const isCompleted = request.nextUrl.searchParams.get("isCompleted");

  let responseBody: GamesGetResponseBody;
  if (playerId === null) {
    responseBody = await gameService.findAll();
  } else if (isCompleted) {
    responseBody = await gameService.findCompletedGamesByPlayerId(playerId);
  } else {
    responseBody = await gameService.findByPlayerId(playerId);
  }

  return NextResponse.json(responseBody);
});
