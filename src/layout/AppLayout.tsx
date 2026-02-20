import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet, useNavigate } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  
  // --- TAMBAHAN UNTUK AUTH GUARD ---
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Cek apakah ada data user di localStorage
    const userData = localStorage.getItem("user");
    
    if (!userData) {
      // Jika tidak ada (belum login), tendang ke halaman signin
      navigate("/signin");
    } else {
      // Jika ada, loloskan dan tampilkan layout
      setIsChecking(false);
    }
  }, [navigate]);

  // Tampilkan layar putih dengan teks loading sepersekian detik 
  // agar dashboard tidak sempat "berkedip" terlihat oleh user yang belum login
  if (isChecking) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Memeriksa akses...</div>;
  }
  // ---------------------------------

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;