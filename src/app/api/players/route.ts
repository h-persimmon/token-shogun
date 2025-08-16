import { NextResponse } from "next/server";
import { withErrorHandling } from "../with-error-handling";
import { PlayerService } from "./player.service";
import { PlayersGetResponseBody } from "@/api-interface/players/get-response-body";

/**
 * GETリクエストの処理
 */
export const GET = withErrorHandling(async () => {
  const playerService = PlayerService.getInstance();

  const responseBody: PlayersGetResponseBody = await playerService.findAll();
  return NextResponse.json(responseBody);
});
