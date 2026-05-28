import { Outlet } from "react-router-dom";

// Home.tsx owns its own Navbar overlaid on the gradient hero.
// This layout is intentionally minimal — no wrapper navbar.
export default function LandingLayout() {
  return <Outlet />;
}
