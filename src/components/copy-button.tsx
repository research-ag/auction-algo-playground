import { useRef, useState } from "react";
import { Tooltip, Button } from "@mui/joy";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const CopyButton = () => {
  const timerID = useRef<NodeJS.Timeout | null>(null);

  const [isCopied, setIsCopied] = useState(false);

  const copyTooltipTitle = isCopied ? "✓ Copied" : "Copy to clipboard";

  return (
    <Tooltip title={copyTooltipTitle} disableInteractive>
      <Button
        sx={{ flexShrink: 0 }}
        size="sm"
        startDecorator={<ContentCopyIcon />}
        onClick={() => {
          const clipboardItem = new ClipboardItem({
            "text/plain": new Blob([window.location.href], {
              type: "text/plain",
            }),
          });

          navigator.clipboard.write([clipboardItem]);

          if (timerID.current) {
            clearTimeout(timerID.current);
          }

          setIsCopied(true);

          timerID.current = setTimeout(() => {
            setIsCopied(false);
          }, 3000);
        }}
      >
        Copy link
      </Button>
    </Tooltip>
  );
};

export default CopyButton;
