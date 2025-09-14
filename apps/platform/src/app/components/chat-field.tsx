import { useState } from "react";

/**
 * チャット欄
 */
export default function ChatField() {
  const [prompt, setPrompt] = useState("");

  const handleSendPrompt = () => {
    console.log("送信ボタンが押された");
    if (!prompt.trim()) {
      return;
    }

    // TODO: 処理を追加

    setPrompt("");
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-32">
      <div className="flex gap-3 h-full">
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            // countTokens(e.target.value);
          }}
          placeholder="Enter your prompt!"
          className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* <p>入力のトークン数：{tokenCount}</p> */}
        {/* <p>
          使用可能トークン数：{gameEngine.tokenModule.remainingTokens} /{" "}
          {gameEngine.stage.maxTokens}
        </p> */}

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
