import { withErrorHandling } from "../../util/error/with-error-handling";
import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "../player.service";
import { PlayersLoginPostRequestBody } from "@/api-interface/players/login/post-request-body";
import { SessionService } from "../../util/session/session.service";
import { PlayersLoginPostResponseBody } from "@/api-interface/players/login/post-response-body";

/**
 * POSTリクエストの処理（Kiroが生成）
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const playerService = PlayerService.getInstance();

  const requestBody: PlayersLoginPostRequestBody = await request.json();
  const { playerId } = requestBody;

  // プレイヤーが存在するかチェック（Kiroが生成）
  const player = await playerService.findByIdOrNull(playerId);
  if (!player) {
    const responseBody: PlayersLoginPostResponseBody = {
      isSuccess: false,
      message: "プレイヤーが見つかりません",
      playerId: null,
    };
    return NextResponse.json(responseBody, { status: 404 });
  }

  // セッションにプレイヤーIDを保存（Kiroが生成）
  const sessionService = SessionService.getInstance();
  await sessionService.setCurrentPlayerId(playerId);

  const responseBody: PlayersLoginPostResponseBody = {
    isSuccess: true,
    message: "ログインしました",
    playerId,
  };
  return NextResponse.json(responseBody);
});
