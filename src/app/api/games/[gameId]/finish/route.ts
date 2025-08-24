import { withErrorHandling } from "@/app/api/util/error/with-error-handling";
import { NextRequest, NextResponse } from "next/server";
import { GameService } from "../../game.service";
import { SessionService } from "@/app/api/util/session/session.service";
import { GameFinishPostRequestBody } from "@/api-interface/games/finish/post-request-body";

/**
 * POSTリクエストの処理
 */
export const POST = withErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> },
  ) => {
    const gameService = GameService.getInstance();
    const sessionService = SessionService.getInstance();

    // 簡易認証
    await sessionService.getCurrentPlayerOrThrow();

    // 結果を保存する
    const requestBody: GameFinishPostRequestBody = await request.json();
    const { gameId } = await params;
    const { isCompleted, consumedToken } = requestBody;
    await gameService.finish(gameId, isCompleted, consumedToken);

    return NextResponse.json({});
  },
);
