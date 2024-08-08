type Order = {
  price: number;
  quantity: number;
};

class Index {
  public index = 0;
  public isNew = true;

  advance(b: boolean) {
    if (b) this.index += 1;
    this.isNew = b;
  }
}

export function clearAuction(bids: Order[], asks: Order[]) {
  let priceRange: [number, number] = [0, 0];
  let cumulativeBidVolume = 0;
  let cumulativeAskVolume = 0;
  const bidSide = new Index();
  const askSide = new Index();

  while (bidSide.index < bids.length && askSide.index < asks.length) {
    const bid = bids[bidSide.index];
    const ask = asks[askSide.index];

    if (bid.price < ask.price) break;

    priceRange = [ask.price, bid.price];

    if (bidSide.isNew) cumulativeBidVolume += bid.quantity;
    if (askSide.isNew) cumulativeAskVolume += ask.quantity;

    // Advance indices for the next iteration
    bidSide.advance(cumulativeBidVolume <= cumulativeAskVolume);
    askSide.advance(cumulativeAskVolume <= cumulativeBidVolume);
  }

  return {
    priceRange,
    clearingVolume: Math.min(cumulativeBidVolume, cumulativeAskVolume),
  };
}

export type ChartData = {
  price: number;
  bidVolume: number;
  askVolume: number;
  actualBid: boolean;
  actualAsk: boolean;
  maximalVolume?: number;
};

export function prepareChartData(
  bids: Order[],
  asks: Order[],
  priceRange: [number, number],
  clearingVolume: number
): ChartData[] {
  const data: ChartData[] = [];

  let cumulativeBidVolume = 0;
  let cumulativeAskVolume = 0;

  // Extract unique prices from both bids and asks
  const prices = Array.from(
    new Set([...bids.map((b) => b.price), ...asks.map((a) => a.price)])
  );

  prices.sort((a, b) => a - b);

  for (let price of prices) {
    cumulativeBidVolume = bids
      .filter((order) => order.price >= price)
      .reduce((sum, order) => sum + order.quantity, 0);
    cumulativeAskVolume = asks
      .filter((order) => order.price <= price)
      .reduce((sum, order) => sum + order.quantity, 0);

    data.push({
      price,
      bidVolume: cumulativeBidVolume,
      askVolume: cumulativeAskVolume,
      actualBid: bids.some((v) => v.price === price),
      actualAsk: asks.some((v) => v.price === price),
      maximalVolume:
        price >= priceRange[0] && price <= priceRange[1]
          ? clearingVolume
          : undefined,
    });
  }

  return data;
}
