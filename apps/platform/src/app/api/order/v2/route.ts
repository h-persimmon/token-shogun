import { OrderV2PostRequestBody } from "@/api-interface/order/v2/post-request-body";
import { OrderV2PostResponseBody } from "@/api-interface/order/v2/post-response-body";
import { NextResponse } from "next/server";
import { OrderService } from "./order-service";

export async function POST(request: Request) {
  try {
    const body: OrderV2PostRequestBody = await request.json();
    const { prompt: userPrompt, gameStatusInfo } = body;

    const orderService = new OrderService();

    // レスポンスを作成
    const orderResponseBody = await orderService.order(userPrompt, gameStatusInfo)

    return NextResponse.json(orderResponseBody);
  } catch (error) {
    console.error("Error processing order request:", error);

    // エラーが発生した場合は空の命令配列を返す
    const fallbackResponse: OrderV2PostResponseBody = {
      orders: []
    };

    return NextResponse.json(fallbackResponse, { status: 500 });
  }
}
