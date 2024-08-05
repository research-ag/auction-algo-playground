import { Box, Divider } from "@mui/joy";

import { useOrders } from "./orders";
import OrderList from "./order-list";
import { clearAuction } from "./algo";
import Chart from "./chart";

const Root = () => {
  const bids = useOrders({ comparePriority: (a, b) => a.price - b.price });
  const asks = useOrders({ comparePriority: (a, b) => b.price - a.price });

  const { clearingPrice, clearingVolume } = clearAuction(bids.list, asks.list);

  return (
    <Box>
      <Box
        sx={{
          maxWidth: "900px",
          width: "100%",
          margin: "0 auto",
          padding: { xs: "20px", md: "60px 20px 40px" },
        }}
      >
        <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <OrderList title="Bids" color="success" {...bids} />
          <OrderList title="Asks" color="danger" {...asks} />
        </Box>
        <Divider sx={{ marginY: "24px" }} />
        <Box sx={{ marginBottom: "16px" }}>
          Clearing price: {clearingPrice}; Volume: {clearingVolume}
        </Box>
        <Chart asks={asks.list} bids={bids.list} />
      </Box>
    </Box>
  );
};

export default Root;
