import { useState } from "react";
import { Box, Divider, Typography } from "@mui/joy";

import { useOrders } from "./orders";
import OrderList from "./order-list";
import { clearAuction } from "./algo";

const Root = () => {
  const asks = useOrders({ comparePriority: (a, b) => b.price - a.price });
  const bids = useOrders({ comparePriority: (a, b) => a.price - b.price });

  const [clearingPrice, volume] = clearAuction(bids.list, asks.list);

  return (
    <Box>
      <Box
        sx={{
          maxWidth: "900px",
          width: "100%",
          margin: "0 auto",
          padding: "60px 20px 40px",
        }}
      >
        <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <OrderList title="Asks" color="danger" {...asks} />
          <OrderList title="Bids" color="success" {...bids} />
        </Box>
        <Divider sx={{ marginY: "24px" }} />
        Clearing price: {clearingPrice}; Volume: {volume}
      </Box>
    </Box>
  );
};

export default Root;
