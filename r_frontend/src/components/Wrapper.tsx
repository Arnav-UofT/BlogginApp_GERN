import { Box } from "@chakra-ui/layout";
import React from "react";

export type WrapperVariant = "small" | "regular";
interface WrapperProps {
  variant?: WrapperVariant;
}

export const Wrapper: React.FC<WrapperProps> = ({ children, variant }) => {
  return (
    <Box
      mt={10}
      mx="auto"
      maxW={variant === "regular" ? "600" : "400"}
      w="100%"
    >
      {children}
    </Box>
  );
};
