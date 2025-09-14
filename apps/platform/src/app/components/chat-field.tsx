import { useState } from "react";
import type { GameStatusInfo } from "../../../../game/src/lib/game/order-listner";
import type { Order } from "@kiro-rts/vibe-strategy";
import { OrderV2PostRequestBody } from "@/api-interface/order/v2/post-request-body";
import { OrderV2PostResponseBody } from "@/api-interface/order/v2/post-response-body";
import { TokensCountPostRequestBody } from "@/api-interface/tokens/count/post-request-body";
import { TokensCountPostResponseBody } from "@/api-interface/tokens/count/post-response-body";

interface ChatFieldProps {
  getGameStatusInfo: () => Promise<GameStatusInfo | null>;
  sendOrder: (orders: Order[]) => void;
  addChatMessage: (type: 'user' | 'ai', content: string) => void;
}

/**
 * チャット欄
 */
export default function ChatField({ getGameStatusInfo, sendOrder, addChatMessage }: ChatFieldProps) {
  const [prompt, setPrompt] = useState("");
  const [inputTokenCount, setInputTokenCount] = useState(0);
  const [usedTokenCount, setUsedTokenCount] = useState(0);

  const handleSendPrompt = async () => {
    console.log("送信ボタンが押された");
    const currentPrompt = prompt;
    addChatMessage("user", currentPrompt);
    setPrompt("");
    setUsedTokenCount((usedTokenCount) => usedTokenCount + inputTokenCount)
    setInputTokenCount(0)

    const gameStatusInfo = await getGameStatusInfo();
    const url = "/api/order/v2";
    const orderRequestBody: OrderV2PostRequestBody = { 
      prompt: currentPrompt,
      gameStatusInfo
    };
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(orderRequestBody),
    });
    const responseBody: OrderV2PostResponseBody = await response.json()
    const orders = responseBody.orders;
    sendOrder(orders);

    addChatMessage("ai",
      orders.map(order => {
        const parts = [];
        if (order.type) parts.push(`Type: ${order.type}`);
        if ('entityId' in order && order.entityId) parts.push(`Entity ID: ${order.entityId}`);
        if ('targetEnemyTypeId' in order && order.targetEnemyTypeId) parts.push(`Target Enemy: ${order.targetEnemyTypeId}`);
        if ('targetStructureId' in order && order.targetStructureId) parts.push(`Target Structure: ${order.targetStructureId}`);
        return parts.join(', ');
      }).join('\n')
    )
  };

  const countTokens = async (text: string) => {
    try {
      const url = "/api/tokens/count";
      const requestBody: TokensCountPostRequestBody = { prompt: text };
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      const responseBody: TokensCountPostResponseBody = await response.json()
      setInputTokenCount(responseBody.tokens)
    } catch (error) {
      console.error("トークンカウントエラー:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-32">
      <div className="flex gap-3 h-full">
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            countTokens(e.target.value);
          }}
          placeholder="Enter your prompt!"
          className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <p>currentInputToken：{inputTokenCount}</p>
        <p>usedToken：{usedTokenCount}</p>

        <button
          onClick={handleSendPrompt}
          className="px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
        >
          Send
        </button>
      </div>
    </div>
  );
}
