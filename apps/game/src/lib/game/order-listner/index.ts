import { Order } from "@kiro-rts/vibe-strategy";

export class OrderListener {
  private stackedOrders: Order[] = [];

  public addOrder(order: Order): void {
    this.stackedOrders.push(order);
  }

  public getOrders(): Order[] {
    const orders = this.stackedOrders;
    this.clearOrders();
    return orders;
  }

  private clearOrders(): void {
    this.stackedOrders = [];
  }
}
