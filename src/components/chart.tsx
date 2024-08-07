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
          canvas.width = 1280;
          canvas.height = 720;
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

        const { clearingPrice, clearingVolume } = clearAuction(bids, asks);
        const data = prepareChartData(bids, asks, clearingVolume);

        if (!data.length) {
          return;
        }

        const margin = { top: 20, right: 40, bottom: 50, left: 50 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3
          .select(svgRef.current)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3
          .scaleLinear()
          .domain([0, d3.max(data, (d) => d.price) ?? 0])
          .range([0, width]);

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

        // Add Maximal volume line
        svg
          .append("path")
          .datum(data.filter((item) => item.maximalVolume))
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-width", 2)
          .attr("d", askLine);

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

          svg
            .append("text")
            .attr("x", x(clearingPrice) + 5)
            .attr("y", y(0) - 5)
            .attr("fill", "gray")
            .text("Clearing price");

          // Add Clearing volume line
          svg
            .append("line")
            .attr("x1", x(0))
            .attr("y1", y(clearingVolume))
            .attr("x2", x(clearingPrice))
            .attr("y2", y(clearingVolume))
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4");

          svg
            .append("text")
            .attr("x", x(0) + 5)
            .attr("y", y(clearingVolume) - 5)
            .attr("fill", "gray")
            .text("Clearing volume");
        }

        // Add green points on bids line
        svg
          .selectAll(".bid-circle")
          .data(data.filter((item) => item.actualBid))
          .enter()
          .append("circle")
          .attr("class", "bid-circle")
          .attr("cx", (d) => x(d.price))
          .attr("cy", (d) => y(d.bidVolume))
          .attr("r", 3)
          .attr("fill", "green");

        // Add red points on asks line
        svg
          .selectAll(".ask-circle")
          .data(data.filter((item) => item.actualAsk))
          .enter()
          .append("circle")
          .attr("class", "ask-circle")
          .attr("cx", (d) => x(d.price))
          .attr("cy", (d) => y(d.askVolume))
          .attr("r", 3)
          .attr("fill", "red");

        // Add intersection points
        const intersectionData = data.filter(
          (d) => d.actualAsk && d.actualBid && d.askVolume === d.bidVolume
        );

        const intersectionGroup = svg
          .selectAll(".intersection-circle")
          .data(intersectionData)
          .enter()
          .append("g")
          .attr(
            "transform",
            (d) => `translate(${x(d.price)}, ${y(d.askVolume)}) rotate(45)`
          ); // Rotate group by 45 degrees

        const arcGenerator = d3.arc<d3.DefaultArcObject>();

        intersectionGroup
          .append("path")
          .attr(
            "d",
            arcGenerator({
              innerRadius: 0,
              outerRadius: 4,
              startAngle: 0,
              endAngle: Math.PI,
            })
          )
          .attr("fill", "red");

        intersectionGroup
          .append("path")
          .attr(
            "d",
            arcGenerator({
              innerRadius: 0,
              outerRadius: 4,
              startAngle: Math.PI,
              endAngle: 2 * Math.PI,
            })
          )
          .attr("fill", "green");

        // Add Clearing volume point
        svg
          .append("circle")
          .attr("cx", x(clearingPrice))
          .attr("cy", y(clearingVolume))
          .attr("r", 7)
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-width", 2);

        // Add legend background
        const legend = svg
          .append("g")
          .attr("transform", `translate(${width - 160}, 30)`)
          .attr("class", "legend");

        legend
          .append("rect")
          .attr("x", -10)
          .attr("y", -10)
          .attr("width", 200)
          .attr("height", 170)
          .attr("fill", "white")
          .attr("stroke", "gray")
          .attr("fill-opacity", 0.7);

        // Add legend items
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
          .attr("x", 35)
          .attr("y", 10)
          .attr("dy", "0.35em")
          .attr("fill", "black")
          .text("Bids");

        legend
          .append("line")
          .attr("x1", 10)
          .attr("y1", 30)
          .attr("x2", 30)
          .attr("y2", 30)
          .attr("stroke", "red")
          .attr("stroke-width", 2);

        legend
          .append("text")
          .attr("x", 35)
          .attr("y", 30)
          .attr("dy", "0.35em")
          .attr("fill", "black")
          .text("Asks");

        // Actual bid
        legend
          .append("circle")
          .attr("cx", 20)
          .attr("cy", 50)
          .attr("r", 3)
          .attr("fill", "green");

        legend
          .append("text")
          .attr("x", 35)
          .attr("y", 50)
          .attr("dy", "0.35em")
          .attr("fill", "black")
          .text("Actual bid");

        // Actual ask
        legend
          .append("circle")
          .attr("cx", 20)
          .attr("cy", 70)
          .attr("r", 3)
          .attr("fill", "red");

        legend
          .append("text")
          .attr("x", 35)
          .attr("y", 70)
          .attr("dy", "0.35em")
          .attr("fill", "black")
          .text("Actual ask");

        // Actual bid & ask (half green, half red)
        const intersectionGroupLegend = legend
          .append("g")
          .attr("transform", "translate(20, 90) rotate(45)");

        intersectionGroupLegend
          .append("path")
          .attr(
            "d",
            arcGenerator({
              innerRadius: 0,
              outerRadius: 5,
              startAngle: 0,
              endAngle: Math.PI,
            })
          )
          .attr("fill", "red");

        intersectionGroupLegend
          .append("path")
          .attr(
            "d",
            arcGenerator({
              innerRadius: 0,
              outerRadius: 5,
              startAngle: Math.PI,
              endAngle: 2 * Math.PI,
            })
          )
          .attr("fill", "green");

        legend
          .append("text")
          .attr("x", 35)
          .attr("y", 90)
          .attr("dy", "0.35em")
          .attr("fill", "black")
          .text("Actual bid & ask");

        // Max volume range
        legend
          .append("line")
          .attr("x1", 10)
          .attr("y1", 110)
          .attr("x2", 30)
          .attr("y2", 110)
          .attr("stroke", "orange")
          .attr("stroke-width", 2);

        legend
          .append("text")
          .attr("x", 35)
          .attr("y", 110)
          .attr("dy", "0.35em")
          .attr("fill", "black")
          .text("Max volume range");

        // Clearing volume
        legend
          .append("circle")
          .attr("cx", 20)
          .attr("cy", 130)
          .attr("r", 7)
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-width", 2);

        legend
          .append("text")
          .attr("x", 35)
          .attr("y", 130)
          .attr("dy", "0.35em")
          .attr("fill", "black")
          .text("Clearing volume");

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
