import { useEffect, useState } from "react";

export enum StoreKey {
  BIDS = "bids",
  ASKS = "asks",
}

export interface Order {
  id?: number;
  price: number;
  quantity: number;
}

export interface OrdersObject {
  list: Array<Order>;
  addOrder: (order: Order) => void;
  removeOrder: (index: number) => void;
  reset: () => void;
}

interface UseOrdersParams {
  storeKey: string;
  comparePriority: (a: Order, b: Order) => number;
}

export const useOrders = ({
  storeKey,
  comparePriority,
}: UseOrdersParams): OrdersObject => {
  const [list, setList] = useState<Array<Order>>([]);

  const parseQS = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const ordersFromQS = queryParams.get(storeKey);
    if (ordersFromQS) {
      try {
        const parsed = ordersFromQS
          .split(";")
          .filter(Boolean)
          .map((orderStr) => {
            const [price, quantity] = orderStr.split(",").map(Number);
            if ([price, quantity].some((v) => Number.isNaN(v))) {
              throw new Error();
            }
            return { price, quantity };
          });

        syncQS(parsed);
        setList(parsed);
      } catch (e) {
        syncQS([]);
        setList([]);
        console.error(`Failed to parse "${storeKey}" from query params`, e);
      }
    }
  };

  const syncQS = (orders: Array<Order>) => {
    const serialized = orders.map((o) => `${o.price},${o.quantity}`).join(";");

    const queryParams = new URLSearchParams(window.location.search);

    if (serialized) {
      queryParams.set(storeKey, serialized);
    } else {
      queryParams.delete(storeKey);
    }

    // Delete all not supported keys from query params
    const supportedSortKeys: string[] = Object.values(StoreKey);
    queryParams.forEach((_, key) => {
      if (!supportedSortKeys.includes(key)) {
        queryParams.delete(key);
      }
    });

    const newUrl = queryParams.toString()
      ? `${window.location.pathname}?${queryParams.toString()}`
      : window.location.pathname;

    window.history.replaceState(null, "", newUrl);
  };

  const addOrder = (order_: Order) => {
    const order: Order = { ...order_, id: Date.now() };

    const indexToInsert = list.findIndex((o) => comparePriority(o, order) < 0);

    const newList =
      indexToInsert === -1
        ? [...list, order]
        : [
            ...list.slice(0, indexToInsert),
            order,
            ...list.slice(indexToInsert),
          ];

    syncQS(newList);
    setList(newList);
  };

  const removeOrder = (index: number) => {
    const newList = list.filter((_, i) => i !== index);
    syncQS(newList);
    setList(newList);
  };

  const reset = () => {
    syncQS([]);
    setList([]);
  };

  useEffect(() => {
    parseQS();
  }, []);

  return { list, addOrder, removeOrder, reset };
};
