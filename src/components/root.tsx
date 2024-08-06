import { Box, Divider } from "@mui/joy";

import { StoreKey, useOrders } from "./orders";
import OrderList from "./order-list";
import { clearAuction } from "./algo";
import Chart from "./chart";
import CopyButton from "./copy-button";

const Root = () => {
  const bids = useOrders({
    storeKey: StoreKey.BIDS,
    comparePriority: (a, b) => a.price - b.price,
  });

  const asks = useOrders({
    storeKey: StoreKey.ASKS,
    comparePriority: (a, b) => b.price - a.price,
  });

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
        <Box
          sx={{ display: "flex", alignItems: "center", marginBottom: "16px" }}
        >
          <Box>
            Clearing price: {clearingPrice}; Volume: {clearingVolume}
          </Box>
          <Box sx={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            <CopyButton />
          </Box>
        </Box>
        <Chart asks={asks.list} bids={bids.list} />
      </Box>
    </Box>
  );
};

export default Root;
