import { useRef } from "react";
import { Box, Divider, Button } from "@mui/joy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import { StoreKey, useOrders } from "./orders";
import OrderList from "./order-list";
import { clearAuction } from "./algo";
import Chart, { ChartHandle } from "./chart";
import CopyButton from "./copy-button";

const Root = () => {
  const chartRef = useRef<ChartHandle>(null);

  const bids = useOrders({
    storeKey: StoreKey.BIDS,
    comparePriority: (a, b) => a.price - b.price,
  });

  const asks = useOrders({
    storeKey: StoreKey.ASKS,
    comparePriority: (a, b) => b.price - a.price,
  });

  const { priceRange, clearingVolume } = clearAuction(bids.list, asks.list);

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
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap-reverse",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <Box>
            Clearing price: {priceRange[0]}; Volume: {clearingVolume}
          </Box>
          <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Button
              sx={{ flexShrink: 0 }}
              size="sm"
              variant="outlined"
              onClick={() => {
                bids.reset();
                asks.reset();
              }}
            >
              Clear all
            </Button>
            <Button
              sx={{ flexShrink: 0 }}
              size="sm"
              startDecorator={<FileDownloadIcon />}
              onClick={() => {
                console.log("ref.current", chartRef.current);
                if (chartRef.current) {
                  chartRef.current.downloadImage();
                }
              }}
            >
              PNG
            </Button>
            <CopyButton />
          </Box>
        </Box>
        <Chart ref={chartRef} asks={asks.list} bids={bids.list} />
      </Box>
    </Box>
  );
};

export default Root;
