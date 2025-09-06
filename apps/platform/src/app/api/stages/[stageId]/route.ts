import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "../../util/error/with-error-handling";
import { StageService } from "../stage.service";

/**
 * GETリクエストの処理
 */
export const GET = withErrorHandling(
  async (
    _: NextRequest,
    { params }: { params: Promise<{ stageId: string }> },
  ) => {
    const stageService = StageService.getInstance();
    const { stageId } = await params;
    return NextResponse.json(stageService.findByIdOrFail(stageId));
  },
);
