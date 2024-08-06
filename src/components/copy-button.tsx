import { useRef, useState } from "react";
import { Tooltip, IconButton } from "@mui/joy";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const CopyButton = () => {
  const timerID = useRef<NodeJS.Timeout | null>(null);

  const [isCopied, setIsCopied] = useState(false);

  const copyTooltipTitle = isCopied ? "✓ Copied" : "Copy to clipboard";

  return (
    <Tooltip title={copyTooltipTitle} disableInteractive>
      <IconButton
        size="sm"
        variant="solid"
        color="primary"
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
        <ContentCopyIcon />
      </IconButton>
    </Tooltip>
  );
};

export default CopyButton;
