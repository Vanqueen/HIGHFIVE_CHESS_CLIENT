import type { ReactNode } from "react";

export default function Button({ color, children }: { color: string, children?: ReactNode }) {
  const colorVariants: {[key: string]: string;} = {
    blue: "bg-blue-600 hover:bg-blue-500",
    red: "bg-red-600 hover:bg-red-500",
  };
  return <button className={`${colorVariants[color]} ...`}>{children}</button>;
}