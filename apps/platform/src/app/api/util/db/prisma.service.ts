import { PrismaClient } from "@prisma/client";

/**
 * Prismaサービス（Kiroが生成）
 */
export class PrismaService {
  /**
   * PrismaClientのインスタンス
   */
  private static prisma: PrismaClient | null = null;

  /**
   * PrismaClientを初期化する関数（Kiroが生成）
   */
  public static async initialize(): Promise<void> {
    if (this.prisma) {
      return;
    }

    this.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });

    await this.prisma.$connect();
  }

  /**
   * PrismaClientを取得する関数（Kiroが生成）
   */
  public static getClient(): PrismaClient {
    if (!PrismaService.prisma) {
      throw new Error(
        "Prisma client is not initialized. Call initialize() first.",
      );
    }
    return PrismaService.prisma;
  }

  /**
   * 接続を切断する関数（Kiroが生成）
   */
  public static async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
  }
}
