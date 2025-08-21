import { NextResponse } from "next/server";
import { PrismaService } from "../db/prisma.service";
import { ResourceNotFoundError as ResourceNotFoundError } from "./custom/resource-not-found-error";

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
    } catch (error) {
      // もしPrismaの初期化ができていなければ、初期化して処理をやりなおす
      if (
        error instanceof Error &&
        error.message.includes("Prisma client is not initialized")
      ) {
        await PrismaService.initialize();
        return await handler(...args);
      }

      // リソースが存在しないエラー
      if (error instanceof ResourceNotFoundError) {
        console.error("[API Error]", error);
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      }

      // それ以外のエラー
      console.error("[API Error]", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  };
};
