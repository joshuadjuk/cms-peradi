import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import Badge from "../components/ui/badge/Badge";

interface DetailData {
  info: {
    id: number;
    title: string;
    case_number: string;
    type: string;
    status: string;
    client_name: string;
    client_type: string;
    phone: string;
    identity_number: string;
  };
  documents: {
    id: number;
    title: string;
    doc_type: string;
    status: string;
    file_path: string;
    uploader_name: string;
  }[];
  schedules: {
    id: number;
    agenda: string;
    schedule_date: string;
    schedule_time: string;
    location: string;
    status: string;
  }[];
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>(); // Tangkap ID dari URL
  const navigate = useNavigate();
  const [data, setData] = useState<DetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`http://localhost:8000/cases.php?action=detail&id=${id}`);
        const result = await response.json();
        if (result.status === "success") {
          setData(result.data);
        } else {
          alert("Kasus tidak ditemukan!");
          navigate("/cases"); // Tendang balik kalau ID ngawur
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  if (isLoading) return <div className="p-10 text-center">Memuat Detail Perkara...</div>;
  if (!data) return null;

  type BadgeColor = "primary" | "success" | "warning" | "error";
  const getStatusColor = (status: string): BadgeColor => {
    if (status === "Open" || status === "Scheduled") return "primary";
    if (status === "Closed" || status === "Completed" || status === "Final") return "success";
    if (status === "In Progress" || status === "Postponed" || status === "Draft") return "warning";
    return "error";
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Detail Perkara" />
      
      {/* Tombol Back */}
      <button onClick={() => navigate("/cases")} className="mb-4 text-sm text-brand-500 font-medium hover:underline">
        &larr; Kembali ke Daftar Perkara
      </button>

      {/* CARD 1: Info Perkara & Klien */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-theme-sm dark:bg-gray-900 dark:border-gray-800 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">{data.info.title}</h2>
            <p className="text-gray-500">Nomor Register: <span className="font-medium text-gray-800 dark:text-white">{data.info.case_number || "Belum Ada"}</span></p>
          </div>
          <Badge size="md" color={getStatusColor(data.info.status)}>{data.info.status}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl dark:bg-white/[0.03]">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Informasi Klien</p>
            <p className="font-medium text-gray-800 dark:text-white">{data.info.client_name}</p>
            <p className="text-sm text-gray-500">{data.info.client_type} | {data.info.identity_number}</p>
            <p className="text-sm text-gray-500">📞 {data.info.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Klasifikasi Hukum</p>
            <p className="font-medium text-gray-800 dark:text-white">{data.info.type}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 2: Dokumen Terlampir */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-theme-sm dark:bg-gray-900 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white">Dokumen & Bukti</h3>
            <Link to="/documents" className="text-xs text-brand-500 hover:underline">+ Unggah Baru</Link>
          </div>
          <ul className="space-y-3">
            {data.documents.length === 0 ? <p className="text-sm text-gray-500">Belum ada dokumen.</p> : 
              data.documents.map(doc => (
                <li key={doc.id} className="p-3 border border-gray-100 rounded-lg flex justify-between items-center dark:border-gray-800">
                  <div>
                    <p className="font-medium text-sm text-gray-800 dark:text-white">{doc.title}</p>
                    <p className="text-xs text-gray-500">{doc.doc_type} | Oleh: {doc.uploader_name}</p>
                  </div>
                  <a href={`http://localhost:8000/api/${doc.file_path}`} target="_blank" rel="noreferrer" className="text-xs bg-brand-50 text-brand-600 px-3 py-1 rounded hover:bg-brand-100">Buka</a>
                </li>
              ))
            }
          </ul>
        </div>

        {/* CARD 3: Jadwal Sidang */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-theme-sm dark:bg-gray-900 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white">Riwayat & Jadwal Sidang</h3>
            <Link to="/schedules" className="text-xs text-brand-500 hover:underline">+ Tambah Agenda</Link>
          </div>
          <ul className="space-y-3">
            {data.schedules.length === 0 ? <p className="text-sm text-gray-500">Belum ada jadwal.</p> : 
              data.schedules.map(sched => (
                <li key={sched.id} className="p-3 border border-gray-100 rounded-lg flex justify-between items-center dark:border-gray-800">
                  <div>
                    <p className="font-medium text-sm text-gray-800 dark:text-white">{sched.agenda}</p>
                    <p className="text-xs text-gray-500">📅 {sched.schedule_date} ⏰ {sched.schedule_time}</p>
                    <p className="text-xs text-gray-500">📍 {sched.location}</p>
                  </div>
                  <Badge size="sm" color={getStatusColor(sched.status)}>{sched.status}</Badge>
                </li>
              ))
            }
          </ul>
        </div>
      </div>
    </div>
  );
}