import { cookies } from "next/headers";
import { NoPlayerSelectedError } from "../error/custom/no-player-selected-error";

/**
 * セッション管理のユーティリティ（Kiroが生成）
 */
export class SessionService {
  /**
   * Cookie名
   */
  private readonly SESSION_COOKIE_NAME = "player-session";

  /**
   * セッション期限
   */
  private readonly SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7日間

  /**
   * インスタンス（Singleton用）
   */
  private static instance: SessionService;

  /**
   * コンストラクタ（Kiroが生成）
   */
  private constructor() {}

  /**
   * インスタンスを取得する（Kiroが生成）
   */
  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * セッションにプレイヤーIDを保存する（Kiroが生成）
   */
  public async setCurrentPlayerId(playerId: string): Promise<void> {
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
  public async getCurrentPlayerIdOrNull(): Promise<string | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(this.SESSION_COOKIE_NAME);
    return sessionCookie?.value || null;
  }

  /**
   * セッションからプレイヤーIDを取得し、なければ例外を投げる
   */
  public async getCurrentPlayerIdOrThrow(): Promise<string> {
    const currentPlayerId = await this.getCurrentPlayerIdOrNull();
    if (currentPlayerId === null) {
      throw new NoPlayerSelectedError();
    }
    return currentPlayerId;
  }

  /**
   * セッションからプレイヤーIDを削除する（Kiroが生成）
   */
  public async clearCurrentPlayerId(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(this.SESSION_COOKIE_NAME);
  }
}
