
import { ReactNode, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Calendar, Home, LogOut, Menu, Plus, Settings, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Define navigation items based on user role
  const navItems = user?.role === "ngo" 
    ? [
        { icon: Home, label: "Dashboard", path: "/dashboard" },
        { icon: Calendar, label: "Events", path: "/events" },
        { icon: Users, label: "Volunteers", path: "/volunteers" },
        { icon: Settings, label: "Settings", path: "/settings" },
      ]
    : [
        { icon: Home, label: "Dashboard", path: "/dashboard" },
        { icon: Settings, label: "Settings", path: "/settings" },
      ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="fixed left-4 top-4 z-40 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full bg-white shadow-md"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo and branding */}
          <div className="flex h-16 items-center border-b px-4">
            <div className="flex items-center space-x-2 font-semibold text-green-600">
              <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center">VL</div>
              <span>Volunteer Link</span>
            </div>
          </div>

          {/* User info */}
          <div className="border-b p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-green-100">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.first || "User"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-medium text-green-600">
                    {(user?.first || "U")[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{user?.first || "Welcome"}</p>
                <p className="text-xs text-gray-500">{user?.role === "ngo" ? "Organization" : "User"}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                        isActive
                          ? "bg-green-50 text-green-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              
              {user?.role === "ngo" && (
                <li>
                  <Link
                    to="/create-event"
                    onClick={() => setSidebarOpen(false)}
                    className="mt-6 flex items-center space-x-3 rounded-md bg-green-600 px-3 py-2 text-white transition-colors hover:bg-green-700"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Event</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="border-t p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
