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

export function clearAuction(bids: Order[], asks: Order[]): [number, number] {
  let clearingPrice = 0;
  let cumulativeBidVolume = 0;
  let cumulativeAskVolume = 0;
  const bidSide = new Index();
  const askSide = new Index();

  while (bidSide.index < bids.length && askSide.index < asks.length) {
    const bid = bids[bidSide.index];
    const ask = asks[askSide.index];

    if (bid.price < ask.price) break;

    clearingPrice = ask.price;

    if (bidSide.isNew) cumulativeBidVolume += bid.quantity;
    if (askSide.isNew) cumulativeAskVolume += ask.quantity;

    // advance indices for the next iteration
    bidSide.advance(cumulativeBidVolume <= cumulativeAskVolume);
    askSide.advance(cumulativeAskVolume <= cumulativeBidVolume);
  }

  return [clearingPrice, Math.min(cumulativeBidVolume, cumulativeAskVolume)];
}
