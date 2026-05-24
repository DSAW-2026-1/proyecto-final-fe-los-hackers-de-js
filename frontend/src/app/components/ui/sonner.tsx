"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      offset={
        props.position?.startsWith("top") 
          ? (typeof props.offset === "object" ? { ...props.offset, top: 72 } : { top: 72 })
          : props.offset
      }
      {...props}
    />
  );
};

export { Toaster };
