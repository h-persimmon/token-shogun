import { OrderRequestBody } from "@/api-interface/order/request-body";
import { NextResponse } from "next/server";
import { OrderHandler } from "./order-handler";

export async function POST(request: Request) {
  try {
    const body: OrderRequestBody = await request.json();
    const orderHandler = new OrderHandler();
    const orderResponseBody = await orderHandler.sendPromptToAi(body.prompt);
    console.log(orderResponseBody);
    return NextResponse.json(orderResponseBody);
  } catch (error) {
    console.log(error);
  }
}
