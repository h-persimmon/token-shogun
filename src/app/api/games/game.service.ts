import { PrismaService } from "../util/db/prisma.service";
import type { Game, Player } from "@prisma/client";
import { ResourceNotFoundError } from "../util/error/custom/resource-not-found-error";

// プレイヤー情報を含むゲーム型（Kiroが生成）
export type GameWithPlayer = Game & {
  player: Player;
};

/**
 * ゲームに関するサービス（Kiroが生成）
 */
export class GameService {
  /**
   * インスタンス（Singleton用）
   */
  private static instance: GameService;

  /**
   * コンストラクタ（Kiroが生成）
   */
  private constructor() {}

  /**
   * インスタンスを取得する（Kiroが生成）
   */
  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  /**
   * 全てのゲームを取得する（Kiroが生成）
   */
  public async findAll(): Promise<GameWithPlayer[]> {
    const prisma = PrismaService.getClient();
    return prisma.game.findMany({ include: { player: true } });
  }

  /**
   * 指定されたプレイヤーがプレイしたゲームを取得する（Kiroが生成）
   * @param playerId プレイヤーID
   */
  public async findByPlayerId(playerId: string): Promise<GameWithPlayer[]> {
    const prisma = PrismaService.getClient();
    return prisma.game.findMany({
      where: { playerId },
      include: { player: true },
    });
  }

  /**
   * 指定されたプレイヤーがクリアしたゲームを取得する（Kiroが生成）
   * @param playerId プレイヤーID
   */
  public async findCompletedGamesByPlayerId(
    playerId: string,
  ): Promise<GameWithPlayer[]> {
    const prisma = PrismaService.getClient();
    return prisma.game.findMany({
      where: {
        playerId,
        isCompleted: true,
      },
      include: { player: true },
    });
  }

  /**
   * IDでゲームを取得する（Kiroが生成）
   */
  public async findByIdOrNull(id: string): Promise<GameWithPlayer | null> {
    const prisma = PrismaService.getClient();
    return prisma.game.findUnique({
      where: { id },
      include: { player: true },
    });
  }

  /**
   * IDでゲームを取得し、なければ例外を投げる（Kiroが生成）
   */
  public async findByIdOrFail(id: string): Promise<GameWithPlayer> {
    const prisma = PrismaService.getClient();
    const game = await prisma.game.findUnique({
      where: { id },
      include: { player: true },
    });
    if (!game) {
      throw new ResourceNotFoundError("Game", id);
    }
    return game;
  }

  /**
   * ゲームを作成する（Kiroが生成）
   */
  public async create(stageId: string, playerId: string): Promise<Game> {
    const prisma = PrismaService.getClient();
    return prisma.game.create({
      data: {
        stageId,
        isFinished: false,
        isCompleted: false,
        consumedToken: -1,
        playerId,
      },
    });
  }

  /**
   * ゲームの終了処理
   * @param gameId ゲームID
   * @param isCompleted クリアしたかどうか
   * @param consumedToken 消費したトークン数
   */
  public async finish(
    gameId: string,
    isCompleted: boolean,
    consumedToken: number,
  ): Promise<void> {
    if (consumedToken < 0) {
      throw new Error("消費トークン数が不正です");
    }
    await this.update(gameId, {
      isFinished: true,
      isCompleted,
      consumedToken,
    });
  }

  /**
   * ゲームを終了する（API用）（Kiroが生成）
   */
  public async finishGame(
    gameId: string,
    isCompleted: boolean,
    consumedToken: number,
  ): Promise<void> {
    return this.finish(gameId, isCompleted, consumedToken);
  }

  /**
   * ゲームを更新する（Kiroが生成）
   */
  private async update(
    id: string,
    gameData: Partial<
      Pick<Game, "isFinished" | "isCompleted" | "consumedToken">
    >,
  ): Promise<Game | null> {
    const prisma = PrismaService.getClient();
    await prisma.game.update({
      where: { id },
      data: gameData,
    });
    return this.findByIdOrNull(id);
  }
}
