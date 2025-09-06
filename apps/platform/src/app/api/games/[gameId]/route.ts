import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "../../util/error/with-error-handling";
import { GameService } from "../game.service";
import { GameGetResponseBody } from "@/api-interface/games/get-response-body";

/**
 * GETリクエストの処理
 */
export const GET = withErrorHandling(
  async (
    _: NextRequest,
    { params }: { params: Promise<{ gameId: string }> },
  ) => {
    const gameService = GameService.getInstance();
    const { gameId } = await params;

    const responseBody: GameGetResponseBody =
      await gameService.findByIdOrFail(gameId);
    return NextResponse.json(responseBody);
  },
);
