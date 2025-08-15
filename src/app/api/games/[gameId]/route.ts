import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "../../with-error-handling";
import { GameService } from "../game.service";

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

    return NextResponse.json(await gameService.findById(gameId));
  },
);
