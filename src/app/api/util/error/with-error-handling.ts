import { NextResponse } from "next/server";
import { PrismaService } from "../db/prisma.service";

/**
 * コントローラのエラー処理をラップした関数（Kiroが生成）
 * @param handler
 * @returns
 */
export const withErrorHandling = <
  T extends (...args: any[]) => Promise<Response>,
>(
  handler: T,
) => {
  return async (...args: Parameters<T>): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      // もしPrismaの初期化ができていなければ、初期化して処理をやりなおす
      if (
        err instanceof Error &&
        err.message.includes("Prisma client is not initialized")
      ) {
        await PrismaService.initialize();
        return await handler(...args);
      }

      // それ以外のエラー
      console.error("[API Error]", err);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  };
};
