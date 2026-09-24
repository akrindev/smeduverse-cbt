import { Menu } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  user
}) {

  if(!user) {
    return <div>Loading</div>
  }

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">

          {/* Header: Left side */}
          <div className="flex">

            {/* Hamburger button */}
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">
                {sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
              </span>
              <Menu size={24} strokeWidth={2} aria-hidden="true" />
            </button>

          </div>

          {/* Header: Right side */}
          <div className="flex items-center">

            {/*  Divider */}
            <hr className="w-px h-6 bg-gray-200 mx-3" />
            <UserMenu user={user} />

          </div>

        </div>
      </div>
    </header>
  );
}