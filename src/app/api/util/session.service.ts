import { cookies } from "next/headers";

/**
 * セッション管理のユーティリティ（Kiroが生成）
 */
export class SessionService {
  private static readonly SESSION_COOKIE_NAME = "player-session";
  private static readonly SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7日間

  /**
   * セッションにプレイヤーIDを保存する（Kiroが生成）
   */
  public static async setPlayerId(playerId: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(this.SESSION_COOKIE_NAME, playerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: this.SESSION_MAX_AGE,
      path: "/",
    });
  }

  /**
   * セッションからプレイヤーIDを取得する（Kiroが生成）
   */
  public static async getPlayerId(): Promise<string | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(this.SESSION_COOKIE_NAME);
    return sessionCookie?.value || null;
  }

  /**
   * セッションからプレイヤーIDを削除する（Kiroが生成）
   */
  public static async clearPlayerId(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(this.SESSION_COOKIE_NAME);
  }
}
