import { useEffect } from "react";
import Auth from "../components/Layouts/Auth";
import Login from "../components/Login";

export default function Index() {
  return (
    <Auth>
      <Login />
    </Auth>
  );
}
