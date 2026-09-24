import { LoaderCircle } from "lucide-react";

export const ThreeDots = () => (
  <LoaderCircle
    size={24}
    strokeWidth={1.5}
    color="#ddd"
    className="animate-spin"
    aria-hidden="true"
  />
);
