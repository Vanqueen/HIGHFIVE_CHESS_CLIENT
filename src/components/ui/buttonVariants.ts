export const buttonVariants = {
  default:
    "bg-white text-gray-800 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300",
  primary:
    "bg-cyan-800 text-white hover:bg-cyan-600 focus:ring-2 focus:ring-cyan-300",
  danger:
    "bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-300",
  success:
    "bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-300",
  secondary:
    "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-300",
  cancel:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-300",
  none: "",
} as const;

export const buttonSizes = {
  default: "px-4 py-1.5 text-sm",
  sm: "px-3 py-1 text-xs",
  lg: "px-6 py-2.5 text-base",
  icon: "h-9 w-9 p-0",
} as const;
