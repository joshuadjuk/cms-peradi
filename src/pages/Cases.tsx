import { Link } from "react-router";
import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";

interface CaseData {
  id: number;
  client_id: string; // Tambahkan ini agar dropdown klien bisa terpilih otomatis
  client_name: string;
  case_number: string | null;
  title: string;
  type: string;
  status: string;
}

interface ClientData {
  id: number;
  name: string;
}

export default function Cases() {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk mode Edit
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    case_number: "",
    type: "Perdata",
    status: "Open",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ error: false, text: "" });

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/cases.php?action=read");
      const data = await response.json();
      if (data.status === "success") setCases(data.data);
    } catch (error) {
      console.error("Gagal mengambil data perkara:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("http://localhost:8000/clients.php?action=read");
      const data = await response.json();
      if (data.status === "success") setClients(data.data);
    } catch (error) {
      console.error("Gagal mengambil opsi klien:", error);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchClients();
  }, []);

  // Fungsi Buka Modal untuk Create
  const handleOpenCreate = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData({ client_id: "", title: "", case_number: "", type: "Perdata", status: "Open" });
    setFormMessage({ error: false, text: "" });
    openModal();
  };

  // Fungsi Buka Modal untuk Edit (otomatis isi data)
  const handleOpenEdit = (c: CaseData) => {
    setIsEdit(true);
    setEditId(c.id);
    setFormData({
      client_id: c.client_id.toString(),
      title: c.title,
      case_number: c.case_number || "",
      type: c.type,
      status: c.status,
    });
    setFormMessage({ error: false, text: "" });
    openModal();
  };

  // Fungsi Submit (Bisa untuk Create maupun Update)
  const handleSubmitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.title || !formData.type) {
      setFormMessage({ error: true, text: "Klien, Judul Perkara, dan Tipe wajib diisi." });
      return;
    }

    setIsSubmitting(true);
    setFormMessage({ error: false, text: "" });

    // Tentukan URL berdasarkan mode (Edit atau Create)
    const url = isEdit 
      ? "http://localhost:8000/cases.php?action=update" 
      : "http://localhost:8000/cases.php?action=create";
      
    // Masukkan ID ke payload jika sedang mode edit
    const payload = isEdit ? { ...formData, id: editId } : formData;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.status === "success") {
        setFormMessage({ error: false, text: data.message });
        fetchCases();
        
        setTimeout(() => {
          closeModal();
          setFormData({ client_id: "", title: "", case_number: "", type: "Perdata", status: "Open" });
        }, 1000);
      } else {
        setFormMessage({ error: true, text: data.message });
      }
    } catch (error) {
      console.error(error);
      setFormMessage({ error: true, text: "Gagal terhubung ke server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCase = async (id: number) => {
    if (window.confirm("Yakin ingin menghapus perkara ini beserta semua jadwal dan dokumennya? Aksi ini tidak bisa dibatalkan!")) {
      try {
        const response = await fetch("http://localhost:8000/cases.php?action=delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await response.json();
        if (data.status === "success") {
          fetchCases(); 
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Error saat menghapus:", error);
        alert("Gagal menghapus perkara.");
      }
    }
  };

  type BadgeColor = "primary" | "success" | "warning" | "error" | "info";
  const getStatusColor = (status: string): BadgeColor => {
    switch (status) {
      case "Open": return "primary";
      case "In Progress": return "warning";
      case "Closed": return "success";
      case "Archived": return "error";
      default: return "primary";
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Manajemen Perkara" />

      <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Daftar Perkara (Kasus)</h2>
          <p className="text-sm text-gray-500">Pantau dan kelola seluruh kasus klien yang sedang berjalan.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleOpenCreate} size="sm">
            + Buka Perkara
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Judul Perkara</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Klien</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nomor Register</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Klasifikasi</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Aksi</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={6}>Memuat data...</td>
                </TableRow>
              ) : cases.length === 0 ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={6}>Belum ada data perkara.</td>
                </TableRow>
              ) : (
                cases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {c.title}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-gray-400 font-medium">
                      {c.client_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {c.case_number || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {c.type}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <Badge size="sm" color={getStatusColor(c.status)}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start flex items-center gap-3">
                      <Link to={`/cases/${c.id}`} className="text-brand-500 hover:text-brand-700 text-sm font-medium">
                        Detail
                      </Link>
                      <button onClick={() => handleOpenEdit(c)} className="text-warning-500 hover:text-warning-700 text-sm font-medium">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteCase(c.id)} className="text-error-500 hover:text-error-700 text-sm font-medium">
                        Hapus
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Tambah/Edit Perkara */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
          {isEdit ? "Edit Perkara" : "Buka Perkara Baru"}
        </h3>
        
        {formMessage.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${formMessage.error ? 'bg-error-50 text-error-600' : 'bg-success-50 text-success-600'}`}>
            {formMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmitCase} className="space-y-4">
          <div>
            <Label>Klien yang Bersangkutan <span className="text-error-500">*</span></Label>
            <select 
              value={formData.client_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
            >
              <option value="">-- Pilih Klien --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Label>Judul / Nama Perkara <span className="text-error-500">*</span></Label>
            <Input 
              type="text" 
              placeholder="Contoh: Gugatan Wanprestasi PT ABCD" 
              value={formData.title} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nomor Register Pengadilan</Label>
              <Input 
                type="text" 
                placeholder="No. PN (Kosongkan jika belum ada)" 
                value={formData.case_number} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, case_number: e.target.value })} 
              />
            </div>
            
            <div>
              <Label>Klasifikasi Perkara</Label>
              <select 
                value={formData.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
              >
                <option value="Pidana">Pidana</option>
                <option value="Perdata">Perdata</option>
                <option value="TUN">Tata Usaha Negara (TUN)</option>
                <option value="Agama">Pengadilan Agama</option>
                <option value="Non-Litigasi">Non-Litigasi (Mediasi/Konsultasi)</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Status Awal</Label>
            <select 
              value={formData.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
            >
              <option value="Open">Open (Baru Dibuka)</option>
              <option value="In Progress">In Progress (Sedang Berjalan)</option>
              <option value="Closed">Closed (Selesai/Putusan)</option>
              <option value="Archived">Archived (Diarsipkan)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Batal
            </button>
            <Button disabled={isSubmitting} size="sm">
              {isSubmitting ? "Menyimpan..." : (isEdit ? "Update Perkara" : "Buka Perkara")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}