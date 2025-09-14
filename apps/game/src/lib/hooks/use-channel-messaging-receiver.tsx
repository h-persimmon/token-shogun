import { use } from 'matter';
import { OrderListener } from '../game/order-listner/index';
import { useEffect } from 'react';
import { Order } from '@kiro-rts/vibe-strategy';
import { useState } from 'react';

// get-game-status-info | send-orderの2択
export type MessageEventData = {
  type: 'get-game-status-info'
} | {
  type: 'send-order',
  orders: Order[]
}

export const useChannelMessagingReceiver = (orderListener: OrderListener) => {
  const [port, setPort] = useState<MessagePort | null>(null);
  useEffect(() => {
    function initPort (e: MessageEvent<any>) {
      if (e.data && e.data.type === 'init') {
        const port2 = e.ports[0];
        setPort(port2);
      }
    }
    window.addEventListener("message", initPort);
    return () => {
      window.removeEventListener("message", initPort);
    };
  }, [orderListener]);

  useEffect(() => {
    if (!port) return;
    function handleMessage (e: MessageEvent<MessageEventData>) {
      console.log('Received message in game:', e.data);
      if (e.data.type === 'get-game-status-info') {
        const gameStatusInfo = orderListener['gameStatusInfo'];
        port?.postMessage({
          type: 'game-status-info',
          gameStatusInfo,
        });
      } else if (e.data.type === 'send-order') {
        const orders = e.data.orders;
        orders.forEach(order => {
          orderListener.addOrder(order);
        });
      }
    }

    port.onmessage = handleMessage;
    console.log("PORT2:", port);

    return () => {
      port.onmessage = null;
    };
  }, [port, orderListener]);
}
