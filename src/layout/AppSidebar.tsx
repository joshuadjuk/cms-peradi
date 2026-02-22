import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Menggunakan icon yang sudah ada dari template
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PageIcon,
  PlugInIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";

// 1. Tambahkan 'allowedRoles' pada tipe NavItem untuk RBAC
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  allowedRoles?: string[]; // Array berisi role apa saja yang boleh melihat menu ini
  subItems?: { name: string; path: string; allowedRoles?: string[] }[];
};

// 2. Daftar Menu LCMS PERADI beserta aturan RBAC-nya
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    // Jika tidak ada allowedRoles, berarti SEMUA role bisa melihatnya
  },
  {
    icon: <UserCircleIcon />,
    name: "Data Klien",
    path: "/clients",
    allowedRoles: ["Managing Partner", "Lead Lawyer", "Associate", "Paralegal"],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Manajemen Perkara",
    path: "/cases",
    allowedRoles: ["Managing Partner", "Lead Lawyer", "Associate", "Paralegal"],
  },
  {
    icon: <PageIcon />,
    name: "Dokumen & Bukti",
    path: "/documents",
    allowedRoles: ["Managing Partner", "Lead Lawyer", "Associate", "Paralegal"],
  },
  {
    icon: <CalenderIcon />,
    name: "Jadwal Sidang",
    path: "/schedules",
    allowedRoles: ["Managing Partner", "Lead Lawyer", "Associate", "Paralegal"],
  },
  {
    icon: <PageIcon />,
    name: "Invoice",
    path: "/invoices",
    allowedRoles: ["Finance"], 
  },
  {
    icon: <PlugInIcon />,
    name: "Pengaturan User",
    path: "/users",
    // HANYA Super Admin dan Managing Partner yang bisa melihat menu ini
    allowedRoles: ["Super Admin", "Managing Partner"],
  },
  {
    icon: <GridIcon />, // Kamu bisa ganti pakai icon yang lebih cocok misal ShieldIcon / ListIcon
    name: "Log Aktivitas",
    path: "/activity-logs",
    allowedRoles: ["Super Admin", "Managing Partner"], 
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{ index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // --- STATE UNTUK RBAC ---
  const [userRole, setUserRole] = useState<string>("");

  // Ambil Role User dari LocalStorage saat sidebar dirender
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserRole(parsedUser.role_name); // Ambil nama role (misal: "Super Admin")
    }
  }, []);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ index });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu && prevOpenSubmenu.index === index) {
        return null;
      }
      return { index };
    });
  };

  // 3. Modifikasi fungsi render untuk memfilter menu berdasarkan Role
  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items
        // FILTER RBAC: Tampilkan jika allowedRoles tidak diset, ATAU jika role user ada di dalam allowedRoles
        .filter((nav) => !nav.allowedRoles || nav.allowedRoles.includes(userRole))
        .map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index)}
              className={`menu-item group ${
                openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          
          {/* Submenu Rendering */}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.index === index
                    ? `${subMenuHeight[`${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems
                  // Filter sub-menu dengan logika RBAC yang sama
                  .filter((sub) => !sub.allowedRoles || sub.allowedRoles.includes(userRole))
                  .map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu Utama"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;