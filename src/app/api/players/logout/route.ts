import { withErrorHandling } from "../../util/error/with-error-handling";
import { NextResponse } from "next/server";
import { SessionService } from "../../util/session/session.service";

/**
 * POSTリクエストの処理（Kiroが生成）
 */
export const POST = withErrorHandling(async () => {
  const sessionService = SessionService.getInstance();

  // 現在のセッションからプレイヤーIDを取得（Kiroが生成）
  const currentPlayerId = await sessionService.getCurrentPlayerIdOrNull();
  if (!currentPlayerId) {
    return NextResponse.json(
      { error: "ログインしていません" },
      { status: 401 },
    );
  }

  // セッションからプレイヤーIDを削除（Kiroが生成）
  await sessionService.clearCurrentPlayerId();

  const responseBody = {
    message: "ログアウトしました",
  };
  return NextResponse.json(responseBody);
});
