"use client";

/** True on phones and tablets, where wallets are apps reached by deep link rather than browser extensions. */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function mobileOs(): "ios" | "android" | null {
  if (typeof navigator === "undefined") return null;
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return "ios";
  if (/Android/i.test(navigator.userAgent)) return "android";
  return null;
}
