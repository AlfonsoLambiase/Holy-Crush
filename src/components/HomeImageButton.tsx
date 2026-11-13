"use client";

import Image from "next/image";

import {playClick} from "@/settings/click";

export type CloudFloat = {
  duration: string;
  delay: string;
  x: string;
  y: string;
};

export type HomeImageButtonProps = {
  alt: string;
  src: string;
  width: number;
  height: number;
  className: string;
  float: CloudFloat;
  isPressed?: boolean;
  /** Default true (animazione `home-cloud`). */
  floatAnimation?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
};

export function HomeImageButton({
  alt,
  src,
  width,
  height,
  className,
  float,
  isPressed = false,
  floatAnimation = true,
  children,
  onClick,
}: HomeImageButtonProps) {
  return (
    <button
      aria-label={alt}
      className={`${className} ${floatAnimation ? "home-cloud" : ""} group relative touch-manipulation`}
      style={
        floatAnimation
          ? ({
              "--cloud-duration": float.duration,
              "--cloud-delay": float.delay,
              "--cloud-x": float.x,
              "--cloud-y": float.y,
            } as React.CSSProperties)
          : undefined
      }
      type="button"
      onClick={() => {
        playClick();
        onClick?.();
      }}
    >
      <span
        className={`relative block w-full transition-transform duration-100 ease-out ${
          isPressed
            ? "translate-y-1 scale-[0.93]"
            : "group-active:translate-y-1 group-active:scale-[0.93]"
        }`}
      >
        <Image
          alt={alt}
          className={`h-auto w-full transition-[filter] duration-100 ease-out ${
            isPressed
              ? "brightness-90 drop-shadow-none"
              : "drop-shadow-lg group-active:brightness-90 group-active:drop-shadow-none"
          }`}
          height={height}
          src={src}
          width={width}
        />
        {children}
      </span>
    </button>
  );
}
