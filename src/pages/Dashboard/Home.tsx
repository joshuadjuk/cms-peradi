import React, { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";

// Interface untuk data User
interface UserData {
  id: number;
  name: string;
  role_name: string;
}

// Interface untuk statistik Dashboard
interface DashboardStats {
  total_cases: number;
  total_clients: number;
  upcoming_schedules: number;
  total_users: number;
}

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total_cases: 0,
    total_clients: 0,
    upcoming_schedules: 0,
    total_users: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Ambil data user dari localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // 2. Ambil data statistik dari PHP
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/dashboard.php");
        const data = await response.json();
        if (data.status === "success") {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="p-6 text-gray-500">Memuat Dashboard...</div>;
  }

  return (
    <>
      <PageMeta
        title="Dashboard LCMS | Manajemen Perkara PERADI"
        description="Beranda Sistem Manajemen Perkara (LCMS)"
      />
      
      {/* Banner Selamat Datang */}
      <div className="mb-6 p-6 bg-brand-500 rounded-2xl text-white shadow-theme-sm">
        <h1 className="text-2xl font-bold mb-1">
          Selamat Datang, {user?.name || "Advokat"}!
        </h1>
        <p className="text-brand-100 text-sm">
          Anda login sebagai <span className="font-semibold px-2 py-0.5 bg-white/20 rounded ml-1">{user?.role_name || "Staf"}</span>. 
          Berikut adalah ringkasan sistem hari ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        
        {/* KARTU 1: Jadwal Sidang (Tampil untuk semua kecuali Admin IT) */}
        {user?.role_name !== "Super Admin" && (
          <div className="p-6 bg-white rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800 shadow-theme-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Jadwal Sidang Mendatang</p>
                <h4 className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
                  {stats.upcoming_schedules}
                </h4>
              </div>
              <div className="p-3 bg-warning-50 rounded-lg text-warning-500 dark:bg-warning-500/10">
                {/* SVG Ikon Kalender */}
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
              </div>
            </div>
          </div>
        )}

        {/* KARTU 2: Total Perkara (Tampil untuk semua kecuali Admin IT) */}
        {user?.role_name !== "Super Admin" && (
          <div className="p-6 bg-white rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800 shadow-theme-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Perkara Aktif</p>
                <h4 className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
                  {stats.total_cases}
                </h4>
              </div>
              <div className="p-3 bg-brand-50 rounded-lg text-brand-500 dark:bg-brand-500/10">
                {/* SVG Ikon Koper/Kasus */}
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
            </div>
          </div>
        )}

        {/* KARTU 3: Total Klien (Tampil untuk semua kecuali Admin IT) */}
        {user?.role_name !== "Super Admin" && (
          <div className="p-6 bg-white rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800 shadow-theme-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Klien Terdaftar</p>
                <h4 className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
                  {stats.total_clients}
                </h4>
              </div>
              <div className="p-3 bg-success-50 rounded-lg text-success-500 dark:bg-success-500/10">
                {/* SVG Ikon User */}
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </div>
          </div>
        )}

        {/* KARTU 4: Pengaturan User (HANYA Tampil untuk Super Admin & Managing Partner) */}
        {(user?.role_name === "Super Admin" || user?.role_name === "Managing Partner") && (
          <div className="p-6 bg-white rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800 shadow-theme-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total User Sistem</p>
                <h4 className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
                  {stats.total_users}
                </h4>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {/* SVG Ikon Server/Settings */}
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}