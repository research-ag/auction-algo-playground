import { useRef, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  ChipDelete,
  FormControl,
  FormLabel,
  Input,
  IconButton,
} from "@mui/joy";
import { DefaultColorPalette } from "@mui/joy/styles/types";
import AddIcon from "@mui/icons-material/Add";

import { OrdersObject } from "./orders";

interface OrderListProps extends OrdersObject {
  title: string;
  color: DefaultColorPalette;
}

const OrderList = ({
  title,
  color,
  list,
  addOrder,
  removeOrder,
}: OrderListProps) => {
  const priceRef = useRef<HTMLInputElement>(null);

  const [inputPrice, setInputPrice] = useState("");
  const [inputQuantity, setInputQuantity] = useState("");

  const [priceError, setPriceError] = useState(false);
  const [quantityError, setQuantityError] = useState(false);

  const submit = (): boolean => {
    const validate = (natStr: string) => /^[1-9]\d*$/.test(natStr);
    const priceValid = validate(inputPrice);
    const quantityValid = validate(inputQuantity);
    if (!priceValid) setPriceError(true);
    if (!quantityValid) setQuantityError(true);
    if (priceValid && quantityValid) {
      addOrder({
        price: Number(inputPrice),
        quantity: Number(inputQuantity),
      });
      setInputPrice("");
      setInputQuantity("");
      return true;
    }
    return false;
  };

  const renderInput = ({
    ref,
    label,
    value,
    setValue,
    error,
    setError,
  }: {
    ref?: React.RefObject<HTMLInputElement>;
    label: string;
    value: string;
    setValue: (value: string) => void;
    error: boolean;
    setError: (value: boolean) => void;
  }) => (
    <FormControl sx={{ flex: 1 }} error={error}>
      <FormLabel>{label}</FormLabel>
      <Input
        fullWidth
        size="sm"
        placeholder="Type in here…"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const success = submit();
            if (success) priceRef.current!.focus();
          }
        }}
        slotProps={{
          input: { sx: { width: "100%", minWidth: "120px" }, ref: ref },
        }}
      />
    </FormControl>
  );

  return (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ marginBottom: "8px" }} level="h3" color={color}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Box sx={{ display: "flex", alignItems: "end", gap: "16px" }}>
          {renderInput({
            label: "Price",
            value: inputPrice,
            setValue: setInputPrice,
            error: priceError,
            setError: setPriceError,
            ref: priceRef,
          })}
          {renderInput({
            label: "Quantity",
            value: inputQuantity,
            setValue: setInputQuantity,
            error: quantityError,
            setError: setQuantityError,
          })}
          <IconButton
            sx={{ flexShrink: 0 }}
            size="sm"
            variant="solid"
            onClick={() => {
              submit();
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>
        {!!list.length && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {list.map((order, i) => (
              <Chip
                key={order.id}
                variant="soft"
                color="neutral"
                endDecorator={<ChipDelete onDelete={() => removeOrder(i)} />}
              >
                p:{order.price} q:{order.quantity}
              </Chip>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default OrderList;
