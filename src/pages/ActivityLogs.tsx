import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";

interface ActivityLogData {
  id: number;
  user_name: string;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Nanti API ini kita buat di tahap backend (hanya action=read)
      const response = await fetch("http://localhost:8000/activity_logs.php?action=read");
      const data = await response.json();
      if (data.status === "success") setLogs(data.data);
    } catch (error) {
      console.error("Gagal mengambil data log aktivitas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Fungsi untuk memberi warna badge secara dinamis berdasarkan kata kunci aksi
  type BadgeColor = "primary" | "success" | "warning" | "error" | "info";
  const getActionColor = (action: string): BadgeColor => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("tambah") || act.includes("login")) return "success";
    if (act.includes("update") || act.includes("edit")) return "warning";
    if (act.includes("delete") || act.includes("hapus")) return "error";
    return "info";
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Log Aktivitas (Audit Trail)" />

      <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Rekam Jejak Sistem</h2>
          <p className="text-sm text-gray-500">Pantau semua aktivitas pengguna. Data ini bersifat Read-Only (Hanya Baca).</p>
        </div>
        {/* Perhatikan: Tidak ada tombol +Buat di sini karena ini digenerate otomatis oleh sistem */}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Waktu</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Pengguna</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Aksi</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Modul</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Detail Aktivitas</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">IP Address</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={6}>Memuat data log...</td>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={6}>Belum ada aktivitas terekam.</td>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {log.created_at}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <p className="font-medium text-gray-800 dark:text-white text-theme-sm">{log.user_name}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <Badge size="sm" color={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-medium">
                      {log.module}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <p className="text-sm text-gray-600 dark:text-gray-300 max-w-[250px] truncate" title={log.description}>
                        {log.description}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
                      {log.ip_address}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}