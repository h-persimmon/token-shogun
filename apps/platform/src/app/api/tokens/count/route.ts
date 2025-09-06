import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "../../util/error/with-error-handling";
import { TokensCountPostRequestBody as TokensCountPostRequestBody } from "@/api-interface/tokens/count/post-request-body";
import { TokensCountPostResponseBody } from "@/api-interface/tokens/count/post-response-body";
import { countTokens } from "@anthropic-ai/tokenizer";

/**
 * POSTリクエストの処理
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const requestBody: TokensCountPostRequestBody = await request.json();
  const { prompt } = requestBody;

  const responseBody: TokensCountPostResponseBody = {
    prompt,
    tokens: countTokens(prompt),
  };

  return NextResponse.json(responseBody);
});
