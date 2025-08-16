import { NextRequest, NextResponse } from "next/server";
import { GameService } from "./game.service";
import { GamesPostRequestBody } from "@/api-interface/games/post-request-body";
import { withErrorHandling } from "../with-error-handling";
import { GamesPostResponseBody } from "@/api-interface/games/post-response-body";
import { GamesGetResponseBody } from "@/api-interface/games/get-response-body";

/**
 * POSTリクエストの処理
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const gameService = GameService.getInstance();

  const requestBody: GamesPostRequestBody = await request.json();
  const game = await gameService.create(requestBody.stageId);

  const responseBody: GamesPostResponseBody = { gameId: game.id };
  return NextResponse.json(responseBody);
});

/**
 * GETリクエストの処理
 */
export const GET = withErrorHandling(async () => {
  const gameService = GameService.getInstance();

  const responseBody: GamesGetResponseBody = await gameService.findAll();
  return NextResponse.json(responseBody);
});
