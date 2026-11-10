"use client";

import { Button, type ButtonProps } from "@/components/ui/Button";
import { useModal } from "./ModalProvider";

export function ModalButton({
  modal,
  ...props
}: { modal: "connect" | "tor" } & Omit<ButtonProps, "href" | "onClick">) {
  const { openModal } = useModal();
  return <Button aria-haspopup="dialog" onClick={() => openModal(modal)} {...props} />;
}
