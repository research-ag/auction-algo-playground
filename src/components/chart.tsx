import { Box } from "@mui/joy";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { SHA256, enc } from "crypto-js";
import * as d3 from "d3";

import { Order } from "./orders";
import { ChartData, clearAuction, prepareChartData } from "./algo";

export interface ChartHandle {
  downloadImage: () => void;
}

interface ChartProps {
  asks: Array<Order>;
  bids: Array<Order>;
}

const Chart = forwardRef<ChartHandle, ChartProps>(
  ({ asks, bids }: ChartProps, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const saveSvgAsPng = (svgElement: SVGSVGElement, filename: string) => {
      if (!svgElement) return;

      // Create white background
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      const xmlns = "http://www.w3.org/2000/svg";
      const rect = document.createElementNS(xmlns, "rect");

      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      rect.setAttribute("fill", "white");

      svgClone.insertBefore(rect, svgClone.firstChild);

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          canvas.width = 1220;
          canvas.height = 600;

          const svgBBox = svgElement.getBBox();
          const scale = Math.min(
            canvas.width / svgBBox.width,
            canvas.height / svgBBox.height
          );
          const offsetX = (canvas.width - svgBBox.width * scale) / 2;
          const offsetY = (canvas.height - svgBBox.height * scale) / 2;

          context.fillStyle = "white";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(
            img,
            offsetX,
            offsetY,
            svgBBox.width * scale,
            svgBBox.height * scale
          );

          // Create download link
          const pngUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };

    useImperativeHandle(ref, () => ({
      downloadImage: () => {
        if (svgRef.current) {
          const hash = SHA256(Date.now().toString())
            .toString(enc.Hex)
            .slice(0, 4);

          saveSvgAsPng(svgRef.current, `graph-${hash}.png`);
        }
      },
    }));

    useEffect(() => {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();

        const { priceRange, clearingVolume } = clearAuction(bids, asks);
        const clearingPrice = priceRange[0];
        const data = prepareChartData(bids, asks, priceRange, clearingVolume);

        if (!data.length) {
          return;
        }

        const margin = { top: 10, right: 0, bottom: 70, left: 50 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3
          .select(svgRef.current)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const minPrice = d3.min(data, (d) => d.price)!;
        const maxPrice = d3.max(data, (d) => d.price)!;
        const xDomainMargin = Math.min(
          minPrice,
          Math.ceil((maxPrice - minPrice) * 0.1)
        );
        const xDomain = [minPrice - xDomainMargin, maxPrice + xDomainMargin];

        const x = d3.scaleLinear().domain(xDomain).range([0, width]);

        const y = d3
          .scaleLinear()
          .domain([
            0,
            d3.max(data, (d) => Math.max(d.bidVolume, d.askVolume)) ?? 0,
          ])
          .range([height, 0]);

        const xAxis = d3
          .axisBottom(x)
          .ticks(data.length)
          .tickFormat(d3.format("d"));

        const yAxis = d3
          .axisLeft(y)
          .ticks(
            d3.max(data, (d) =>
              Math.min(Math.max(d.bidVolume, d.askVolume), 10)
            ) ?? 0
          )
          .tickFormat(d3.format("d"));

        svg
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis)
          .append("text")
          .attr("fill", "#000")
          .attr("x", width / 2)
          .attr("y", 40)
          .attr("text-anchor", "middle")
          .text("Price (USD)");

        svg
          .append("g")
          .call(yAxis)
          .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", -45)
          .attr("dy", "0.71em")
          .attr("text-anchor", "middle")
          .text("Cumulative volume (Tokens)");

        svg.append("g").attr("transform", `translate(0,${height})`).call(xAxis);

        svg.append("g").call(yAxis);

        const bidArea = d3
          .area<ChartData>()
          .x((d) => x(d.price))
          .y0(y(0))
          .y1((d) => y(d.bidVolume))
          .curve(d3.curveStepBefore);

        const askArea = d3
          .area<ChartData>()
          .x((d) => x(d.price))
          .y0(y(0))
          .y1((d) => y(d.askVolume))
          .curve(d3.curveStepAfter);

        const intersectionBidArea = d3
          .area<ChartData>()
          .x((d) => x(d.price))
          .y0((d) => y(Math.min(d.bidVolume, d.askVolume)))
          .y1((d) => y(0))
          .curve(d3.curveStepBefore);

        const intersectionAskArea = d3
          .area<ChartData>()
          .x((d) => x(d.price))
          .y0((d) => y(Math.min(d.bidVolume, d.askVolume)))
          .y1((d) => y(0))
          .curve(d3.curveStepAfter);

        // Add light green fill under bids
        svg
          .append("path")
          .datum([
            {
              price: xDomain[0],
              bidVolume: data[0].bidVolume,
              askVolume: 0,
              actualAsk: false,
              actualBid: false,
            } as ChartData,
            ...data,
          ])
          .attr("fill", "#dbffdb")
          .attr("d", bidArea);

        // Add light red fill under asks
        svg
          .append("path")
          .datum([
            ...data,
            {
              price: xDomain[1],
              bidVolume: 0,
              askVolume: data[data.length - 1].askVolume,
              actualAsk: false,
              actualBid: false,
            } as ChartData,
          ])
          .attr("fill", "#ffeeee")
          .attr("d", askArea);

        // Add light orange fill at intersection, part 1
        svg
          .append("path")
          .datum(data.filter((item) => item.price >= clearingPrice))
          .attr("fill", "#fff9e1")
          .attr("d", intersectionBidArea);

        // Add light orange fill at intersection part 2
        svg
          .append("path")
          .datum(data.filter((item) => item.price <= clearingPrice))
          .attr("fill", "#fff9e1")
          .attr("d", intersectionAskArea);

        const bidLine = d3
          .line<ChartData>()
          .x((d) => x(d.price))
          .y((d) => y(d.bidVolume))
          .curve(d3.curveStepBefore);

        const askLine = d3
          .line<ChartData>()
          .x((d) => x(d.price))
          .y((d) => y(d.askVolume))
          .curve(d3.curveStepAfter);

        const maximalVolumeLine = d3
          .line<ChartData>()
          .x((d) => x(d.price))
          .y((d) => y(d.maximalVolume!))
          .curve(d3.curveStepAfter);

        // Add bids line
        svg
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "green")
          .attr("stroke-width", 2)
          .attr("d", bidLine);

        // Add line to connect bid line to x-axis
        svg
          .append("line")
          .attr("x1", x(data[data.length - 1].price))
          .attr("y1", y(data[data.length - 1].bidVolume))
          .attr("x2", x(data[data.length - 1].price))
          .attr("y2", y(0))
          .attr("stroke", "green")
          .attr("stroke-width", 2);

        // Extend the bid line to the left minimum of the domain
        svg
          .append("line")
          .attr("x1", x(data[0].price))
          .attr("y1", y(data[0].bidVolume))
          .attr("x2", x(xDomain[0]))
          .attr("y2", y(data[0].bidVolume))
          .attr("stroke", "green")
          .attr("stroke-width", 2);

        // Add asks line
        svg
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", 2)
          .attr("d", askLine);

        // Add line to connect ask line to x-axis
        svg
          .append("line")
          .attr("x1", x(data[0].price))
          .attr("y1", y(data[0].askVolume))
          .attr("x2", x(data[0].price))
          .attr("y2", y(0))
          .attr("stroke", "red")
          .attr("stroke-width", 2);

        // Extend the ask line to the right maximum of the domain
        svg
          .append("line")
          .attr("x1", x(data[data.length - 1].price))
          .attr("y1", y(data[data.length - 1].askVolume))
          .attr("x2", x(xDomain[1]))
          .attr("y2", y(data[data.length - 1].askVolume))
          .attr("stroke", "red")
          .attr("stroke-width", 2);

        // Add Maximal volume line
        svg
          .append("path")
          .datum(data.filter((item) => item.maximalVolume))
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-width", 2)
          .attr("d", maximalVolumeLine);

        if (clearingVolume !== 0) {
          // Add Clearing price line
          svg
            .append("line")
            .attr("x1", x(clearingPrice))
            .attr("y1", y(0))
            .attr("x2", x(clearingPrice))
            .attr("y2", y(clearingVolume))
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4");

          // Add Clearing price line
          svg
            .append("line")
            .attr("x1", x(xDomain[0]))
            .attr("y1", y(clearingVolume))
            .attr("x2", x(clearingPrice))
            .attr("y2", y(clearingVolume))
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4");

          // Add Clearing price point
          svg
            .append("circle")
            .attr("cx", x(clearingPrice))
            .attr("cy", y(clearingVolume))
            .attr("r", 5)
            .attr("fill", "orange");
        }

        // Add legend below the chart
        const legend = svg
          .append("g")
          .attr(
            "transform",
            `translate(${width / 2 - 252}, ${height + margin.top + 40})`
          )
          .attr("class", "legend");

        // Bids item
        legend
          .append("line")
          .attr("x1", 10)
          .attr("y1", 10)
          .attr("x2", 30)
          .attr("y2", 10)
          .attr("stroke", "green")
          .attr("stroke-width", 2);

        legend
          .append("text")
          .attr("x", 40)
          .attr("y", 15)
          .attr("fill", "black")
          .text("Bids");

        // Asks item
        legend
          .append("line")
          .attr("x1", 100)
          .attr("y1", 10)
          .attr("x2", 120)
          .attr("y2", 10)
          .attr("stroke", "red")
          .attr("stroke-width", 2);

        legend
          .append("text")
          .attr("x", 130)
          .attr("y", 15)
          .attr("fill", "black")
          .text("Asks");

        // Max volume range item
        legend
          .append("line")
          .attr("x1", 190)
          .attr("y1", 10)
          .attr("x2", 210)
          .attr("y2", 10)
          .attr("stroke", "orange")
          .attr("stroke-width", 2);

        legend
          .append("text")
          .attr("x", 220)
          .attr("y", 15)
          .attr("fill", "black")
          .text("Max volume range");

        // Clearing price item
        legend
          .append("circle")
          .attr("cx", 365)
          .attr("cy", 10)
          .attr("r", 5)
          .attr("fill", "orange");

        legend
          .append("text")
          .attr("x", 378)
          .attr("y", 15)
          .attr("fill", "black")
          .text("Clearing price");

        svg
          .selectAll("text")
          .attr("font-family", "Arial")
          .attr("font-size", "14px");
      }
    }, [asks, bids]);

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="auto"
          viewBox="0 0 800 400"
          preserveAspectRatio="xMidYMid meet"
        />
      </Box>
    );
  }
);

export default Chart;
