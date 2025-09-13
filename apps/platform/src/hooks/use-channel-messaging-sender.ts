import { useCallback, useRef } from "react";
import { Order } from "../../../../packages/vibe-strategy"
import type { GameStatusInfo } from "../../../game/src/lib/game/order-listner"

export const useGameConnection = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendOrder = useCallback((orders: Order[]) => {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'send-order',
      orders: orders
    }, '*');
  }, [iframeRef]);

  const getGameStatusInfo = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'get-game-status-info'
    }, '*');

    return new Promise<GameStatusInfo>((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        const message = event.data;
        if (message && message.type === 'game-status-info' && message.gameStatusInfo) {
          const gameStatusInfo: GameStatusInfo = message.gameStatusInfo;
          console.log("Received game status info:", gameStatusInfo);
          resolve(gameStatusInfo);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    });

  }, [iframeRef]);

  return {
    iframeRef,
    sendOrder,
    getGameStatusInfo,
  }
}