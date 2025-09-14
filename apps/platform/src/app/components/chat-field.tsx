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
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Game Command</h3>
      </div>
      <div className="flex-1 p-4">
        <div className="flex flex-col h-full gap-3">
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              countTokens(e.target.value);
            }}
            placeholder="Enter your game command..."
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Input: {inputTokenCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Used: {usedTokenCount}</span>
              </div>
            </div>
            
            <button
              onClick={handleSendPrompt}
              disabled={!prompt.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
