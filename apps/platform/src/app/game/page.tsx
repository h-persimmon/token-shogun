"use client";

import { useState } from 'react';
import { useChannelMessagingSender } from '@/hooks/use-channel-messaging-sender';
import ChatField from '../components/chat-field';
import LogField from '../components/log-field';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function GamePage() {
  const { iframeRef, sendOrder, getGameStatusInfo } = useChannelMessagingSender();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const addChatMessage = (type: 'user' | 'ai', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="flex h-screen">
      {/* 左側3/4 */}
      <div className="w-3/4">
        {/* ゲーム画面 */}
        <div className="bg-gray-800 p-4">
          <iframe
            ref={iframeRef}
            src={process.env.NEXT_PUBLIC_GAME_URL}
            width="100%"
            height="600"
            sandbox="allow-scripts allow-same-origin"
            style={{ border: 'none' }}
          />
        </div>
        {/* チャット欄 */}
        <ChatField sendOrder={sendOrder} getGameStatusInfo={getGameStatusInfo} addChatMessage={addChatMessage} />
      </div>
      {/* 右側1/4 */}
      <div className="w-1/4">
        {/* ログ出力欄 */}
        <LogField messages={chatMessages} />
      </div>
    </div>
  );
}
