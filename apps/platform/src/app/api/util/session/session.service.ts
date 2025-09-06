import { cookies } from "next/headers";
import { NoPlayerSelectedError } from "../error/custom/no-player-selected-error";
import { type Player } from "@prisma/client";
import { PlayerService } from "../../players/player.service";

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
   * プレイヤーに関するサービス
   */
  private readonly playerService: PlayerService;

  /**
   * コンストラクタ（Kiroが生成）
   */
  private constructor() {
    this.playerService = PlayerService.getInstance();
  }

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
   * セッションからプレイヤーを取得する（Kiroが生成）
   */
  public async getCurrentPlayerOrNull(): Promise<Player | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(this.SESSION_COOKIE_NAME);
    if (!sessionCookie) {
      return null;
    }
    return this.playerService.findByIdOrNull(sessionCookie.value);
  }

  /**
   * セッションからプレイヤーを取得し、なければ例外を投げる
   */
  public async getCurrentPlayerOrThrow(): Promise<Player> {
    const currentPlayer = await this.getCurrentPlayerOrNull();
    if (currentPlayer === null) {
      throw new NoPlayerSelectedError();
    }
    return currentPlayer;
  }

  /**
   * セッションからプレイヤーIDを削除する（Kiroが生成）
   */
  public async clearCurrentPlayerId(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(this.SESSION_COOKIE_NAME);
  }
}
