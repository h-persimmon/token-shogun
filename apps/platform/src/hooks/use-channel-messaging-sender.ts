import { useCallback, useRef, useState } from "react";
import { Order } from "../../../../packages/vibe-strategy"
import type { GameStatusInfo } from "../../../game/src/lib/game/order-listner"

export const useChannelMessagingSender = () => {

  const [port, setPort] = useState<MessagePort | null>(null);
  // Ref CallbackでChannel Messagingを初期化
  const iframeRef = useCallback((ref: HTMLIFrameElement | null) => {
    if (ref) {
      // ここでChannel Messagingの初期化を行う
      const channel = new MessageChannel();
      const port1 = channel.port1;
      ref.contentWindow?.postMessage({ type: 'init' }, '*', [channel.port2]);
      setPort(port1);
    }
  }, []);

  const sendOrder = useCallback((orders: Order[]) => {
    port?.postMessage({
      type: 'send-order',
      orders: orders
    });
  }, [port]);

  const getGameStatusInfo = useCallback((): Promise<GameStatusInfo | null> => {
    if(!port) { return Promise.resolve(null); }
    return new Promise<GameStatusInfo>((resolve) => {
      port.onmessage = (event) => {
        console.log("Received message from game:", event.data);
        resolve(event.data.gameStatusInfo as GameStatusInfo);
      }
      port.postMessage({
        type: 'get-game-status-info'
      });
    }).then(data => {
      port.onmessage = null;
      return data;
    });
  }, [port])

  return {
    iframeRef,
    sendOrder,
    getGameStatusInfo,
  }
}