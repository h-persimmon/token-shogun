import { NextResponse } from "next/server";
import { TypeOrmService } from "./db/typeorm-service";
import { DataSourceNotInitializedError } from "./db/data-source-not-initialized-error";

/**
 * コントローラのエラー処理をラップした関数
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
      // もしTypeORMの初期化ができていなければ、初期化して処理をやりなおす
      if (err instanceof DataSourceNotInitializedError) {
        await TypeOrmService.initialize();
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
