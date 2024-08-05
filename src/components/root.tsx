import { useState } from "react";
import { Box, Divider, Typography } from "@mui/joy";

import { useOrders } from "./orders";
import OrderList from "./order-list";

const Root = () => {
  const asks = useOrders({ comparePriority: (a, b) => b.price - a.price });
  const bids = useOrders({ comparePriority: (a, b) => a.price - b.price });

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
          <OrderList title="Bids" color="success" {...asks} />
          <OrderList title="Asks" color="danger" {...bids} />
        </Box>
        <Divider sx={{ marginY: "24px" }} />
        Content
      </Box>
    </Box>
  );
};

export default Root;
