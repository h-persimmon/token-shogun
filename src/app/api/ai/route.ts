import { AiRequestBody } from "@/api-interface/ai/request-body";
import { AiResponseBody } from "@/api-interface/ai/responce-body";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const body: AiRequestBody = await request.json();
    const aiResponce = await sendPrompt(body);
    return NextResponse.json(aiResponce)
  } catch (error) {
    console.log(error);
  }
}

async function sendPrompt(aiRequestBody: AiRequestBody): Promise<AiResponseBody> {
  const url = process.env.BEDROCK_API_URL!;
  const key = process.env.BEDROCK_API_KEY!;

  const payload = {
    "messages": [
      {
        "role": "user",
        "content": [{ "text": aiRequestBody.prompt }]
      }
    ]
  };

  const response = await fetch(url + "/converse", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}
