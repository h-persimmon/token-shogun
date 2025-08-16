import { withErrorHandling } from "../../with-error-handling";
import { NextResponse } from "next/server";
import { SessionService } from "../../util/session.service";

/**
 * POSTリクエストの処理（Kiroが生成）
 */
export const POST = withErrorHandling(async () => {
  // 現在のセッションからプレイヤーIDを取得（Kiroが生成）
  const currentPlayerId = await SessionService.getPlayerId();

  if (!currentPlayerId) {
    return NextResponse.json(
      { error: "ログインしていません" },
      { status: 401 },
    );
  }

  // セッションからプレイヤーIDを削除（Kiroが生成）
  await SessionService.clearPlayerId();

  const responseBody = {
    message: "ログアウトしました",
  };
  return NextResponse.json(responseBody);
});
