import { PrismaService } from "../util/db/prisma.service";
import type { Player } from "@prisma/client";

/**
 * ゲームに関するサービス（Kiroが生成）
 */
export class PlayerService {
  /**
   * インスタンス（Singleton用）
   */
  private static instance: PlayerService;

  /**
   * コンストラクタ（Kiroが生成）
   */
  private constructor() {}

  /**
   * インスタンスを取得する（Kiroが生成）
   */
  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  /**
   * 全てのプレイヤーを取得する（Kiroが生成）
   */
  public async findAll(): Promise<Player[]> {
    const prisma = PrismaService.getClient();
    return prisma.player.findMany();
  }

  /**
   * IDでプレイヤーを取得する（Kiroが生成）
   */
  public async findByIdOrNull(id: string): Promise<Player | null> {
    const prisma = PrismaService.getClient();
    return prisma.player.findUnique({ where: { id } });
  }

  /**
   * IDでプレイヤーを取得し、なければ例外を投げる（Kiroが生成）
   */
  public async findByIdOrFail(id: string): Promise<Player> {
    const prisma = PrismaService.getClient();
    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      throw new Error(`Player with id ${id} not found`);
    }
    return player;
  }

  /**
   * プレイヤーを作成する（Kiroが生成）
   */
  public async create(id: string, name: string): Promise<Player> {
    const prisma = PrismaService.getClient();
    return prisma.player.create({ data: { id, name } });
  }
}
