import { useState } from "react";

export interface Order {
  id?: number;
  price: number;
  quantity: number;
}

export interface OrdersObject {
  list: Array<Order>;
  addOrder: (order: Order) => void;
  removeOrder: (index: number) => void;
}

interface UseOrdersParams {
  comparePriority: (a: Order, b: Order) => number;
}

export const useOrders = ({
  comparePriority,
}: UseOrdersParams): OrdersObject => {
  const [list, setList] = useState<Array<Order>>([]);

  const addOrder = (order_: Order) => {
    const order: Order = { ...order_, id: Date.now() };

    setList((list) => {
      const indexToInsert = list.findIndex(
        (o) => comparePriority(o, order) < 0
      );

      if (indexToInsert === -1) {
        return [...list, order];
      }

      return [
        ...list.slice(0, indexToInsert),
        order,
        ...list.slice(indexToInsert),
      ];
    });
  };

  const removeOrder = (index: number) => {
    setList((list) => list.filter((_, i) => i !== index));
  };

  return { list, addOrder, removeOrder };
};
