import { OrderV2PostRequestBody } from "@/api-interface/order/v2/post-request-body";
import { OrderV2PostResponseBody } from "@/api-interface/order/v2/post-response-body";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body: OrderV2PostRequestBody = await request.json();
    console.log(body);
    const orderResponseBody: OrderV2PostResponseBody = {
        orders: []
    };
    return NextResponse.json(orderResponseBody);
  } catch (error) {
    console.log(error);
  }
}
