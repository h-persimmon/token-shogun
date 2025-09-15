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
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg border border-amber-200 h-full flex flex-col">
      <div className="p-3 border-b border-amber-300 bg-gradient-to-r from-amber-300 to-orange-100">
        <h3 className="text-lg font-semibold text-amber-900">Game Command</h3>
      </div>
      <div className="flex-1 p-3">
        <div className="flex flex-col h-full gap-3">
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              countTokens(e.target.value);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (prompt.trim()) {
                  handleSendPrompt();
                }
              }
            }}
            placeholder="Enter your game command..."
            className="flex-1 p-3 border border-amber-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-300 text-md bg-white/80 backdrop-blur-sm text-amber-900 placeholder-amber-700"
          />

          <div className="flex items-center justify-end gap-2">
            <div className="flex gap-4 text-sm text-amber-800">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>Input: {inputTokenCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                <span>Used: {usedTokenCount}</span>
              </div>
            </div>

            <button
              onClick={handleSendPrompt}
              disabled={!prompt.trim()}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-medium shadow-md"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
