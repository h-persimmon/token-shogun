import { use } from 'matter';
import { OrderListener } from '../game/order-listner/index';
import { useEffect } from 'react';
import { Order } from '@kiro-rts/vibe-strategy';

// get-game-status-info | send-orderの2択
export type MessageEventData = {
  type: 'get-game-status-info'
} | {
  type: 'send-order',
  orders: Order[]
}

export const useChannelMessagingReceiver = (orderListener: OrderListener) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message && message.type === 'send-order' && Array.isArray(message.orders)) {
        (message.orders as Order[]).forEach(order => {
          orderListener.addOrder(order);
        });
      } else if (message && message.type === 'get-game-status-info') {
        const gameStatusInfo = orderListener.getGameStatusInfo();
        (event.source as Window)?.postMessage({
          type: 'game-status-info',
          gameStatusInfo
        }, event.origin);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [orderListener]);
}
