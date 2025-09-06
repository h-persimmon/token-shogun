import { NextResponse } from "next/server";
import { withErrorHandling } from "../util/error/with-error-handling";
import { StageService } from "./stage.service";

/**
 * GETリクエストの処理
 */
export const GET = withErrorHandling(async () => {
  const stageService = StageService.getInstance();
  return NextResponse.json(stageService.findAll());
});
