"use client";

import { useChannelMessagingSender } from '@/hooks/use-channel-messaging-sender';
import ChatField from '../components/chat-field';
import LogField from '../components/log-field';

export default function GamePage() {
  const { iframeRef, sendOrder, getGameStatusInfo } = useChannelMessagingSender();

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
        <ChatField sendOrder={sendOrder} getGameStatusInfo={getGameStatusInfo} />
      </div>
      {/* 右側1/4 */}
      <div className="w-1/4">
        {/* ログ出力欄 */}
        <LogField />
      </div>
    </div>
  );
}
