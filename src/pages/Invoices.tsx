import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router"; // <-- 1. Ini tambahan importnya
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";

interface InvoiceData {
  id: number;
  case_id: string;
  invoice_number: string;
  title: string;
  amount: string | number;
  type: string;
  status: string;
  due_date: string;
  case_title: string;
  client_name: string;
}

interface CaseData {
  id: number;
  title: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk mode Edit
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, openModal, closeModal } = useModal();
  const navigate = useNavigate(); // <-- 2. Ini tambahan inisiasi navigasi

  const [formData, setFormData] = useState({
    case_id: "",
    invoice_number: `INV-${new Date().getFullYear()}-000`, // Auto generate template
    title: "",
    amount: "",
    type: "Retainer Fee",
    status: "Unpaid",
    due_date: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ error: false, text: "" });

  // =========================================================
  // 3. INI GUARD-NYA: Mengecek siapa yang buka halaman ini
  // =========================================================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Jika role BUKAN Finance, langsung tendang ke halaman Dashboard ("/")
      if (parsedUser.role_name !== "Finance") {
        navigate("/"); 
      }
    } else {
      // Jika belum login, tendang ke halaman login
      navigate("/login"); 
    }
  }, [navigate]);
  // =========================================================

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/invoices.php?action=read");
      const data = await response.json();
      if (data.status === "success") setInvoices(data.data);
    } catch (error) {
      console.error("Gagal mengambil data invoice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await fetch("http://localhost:8000/cases.php?action=read");
      const data = await response.json();
      if (data.status === "success") setCases(data.data);
    } catch (error) {
      console.error("Gagal mengambil opsi perkara:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCases();
  }, []);

  // Format Rupiah
  const formatRupiah = (amount: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const handleOpenCreate = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData({ 
      case_id: "", 
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, 
      title: "", 
      amount: "", 
      type: "Retainer Fee", 
      status: "Unpaid", 
      due_date: "" 
    });
    setFormMessage({ error: false, text: "" });
    openModal();
  };

  const handleOpenEdit = (inv: InvoiceData) => {
    setIsEdit(true);
    setEditId(inv.id);
    setFormData({
      case_id: inv.case_id.toString(),
      invoice_number: inv.invoice_number,
      title: inv.title,
      amount: inv.amount.toString(),
      type: inv.type,
      status: inv.status,
      due_date: inv.due_date,
    });
    setFormMessage({ error: false, text: "" });
    openModal();
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.case_id || !formData.title || !formData.amount) {
      setFormMessage({ error: true, text: "Perkara, Judul, dan Nominal wajib diisi." });
      return;
    }

    setIsSubmitting(true);
    setFormMessage({ error: false, text: "" });

    const url = isEdit 
      ? "http://localhost:8000/invoices.php?action=update" 
      : "http://localhost:8000/invoices.php?action=create";
      
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
        fetchInvoices();
        
        setTimeout(() => {
          closeModal();
        }, 1000);
      } else {
        setFormMessage({ error: true, text: data.message });
      }
    } catch (error) {
      console.error("Error submitting invoice:", error);
      setFormMessage({ error: true, text: "Gagal terhubung ke server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    if (window.confirm("Yakin ingin menghapus tagihan ini?")) {
      try {
        const response = await fetch("http://localhost:8000/invoices.php?action=delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await response.json();
        if (data.status === "success") {
          fetchInvoices(); 
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Error deleting invoice:", error);
        alert("Gagal menghapus tagihan.");
      }
    }
  };

  type BadgeColor = "primary" | "success" | "warning" | "error" | "info";
  const getStatusColor = (status: string): BadgeColor => {
    if (status === "Paid") return "success";
    if (status === "Partial") return "warning";
    if (status === "Canceled") return "error";
    return "primary"; // Unpaid
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Keuangan & Tagihan" />

      <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Daftar Tagihan (Invoice)</h2>
          <p className="text-sm text-gray-500">Kelola tagihan biaya perkara, retainer fee, dan operasional.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleOpenCreate} size="sm">
            + Buat Tagihan
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">No. Tagihan</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Judul & Klien</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jatuh Tempo</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nominal (Rp)</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Aksi</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={6}>Memuat data...</td>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={6}>Belum ada data tagihan.</td>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start font-medium text-gray-800 dark:text-white/90">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <p className="font-medium text-gray-800 dark:text-white text-theme-sm">{inv.title}</p>
                      <p className="text-xs text-gray-500">{inv.client_name} - {inv.type}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {inv.due_date}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-gray-800 text-start text-theme-sm dark:text-white">
                      {formatRupiah(inv.amount)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <Badge size="sm" color={getStatusColor(inv.status)}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start flex items-center gap-3">
                      <button onClick={() => handleOpenEdit(inv)} className="text-warning-500 hover:text-warning-700 text-sm font-medium">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteInvoice(inv.id)} className="text-error-500 hover:text-error-700 text-sm font-medium">
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

      {/* Modal Tambah/Edit Tagihan */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
          {isEdit ? "Update Tagihan" : "Buat Tagihan Baru"}
        </h3>
        
        {formMessage.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${formMessage.error ? 'bg-error-50 text-error-600' : 'bg-success-50 text-success-600'}`}>
            {formMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmitInvoice} className="space-y-4">
          <div>
            <Label>Terkait Perkara <span className="text-error-500">*</span></Label>
            <select 
              value={formData.case_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, case_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
            >
              <option value="">-- Pilih Kasus/Perkara --</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nomor Tagihan (Invoice)</Label>
              <Input 
                type="text" 
                value={formData.invoice_number} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, invoice_number: e.target.value })} 
              />
            </div>
            <div>
              <Label>Jenis Tagihan</Label>
              <select 
                value={formData.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
              >
                <option value="Retainer Fee">Retainer Fee</option>
                <option value="Success Fee">Success Fee</option>
                <option value="Operational">Biaya Operasional</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Judul Tagihan <span className="text-error-500">*</span></Label>
            <Input 
              type="text" 
              placeholder="Contoh: Tagihan Operasional Mediasi" 
              value={formData.title} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nominal (Rp) <span className="text-error-500">*</span></Label>
              <Input 
                type="number" 
                placeholder="50000000" 
                value={formData.amount} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: e.target.value })} 
              />
            </div>
            
            <div>
              <Label>Jatuh Tempo</Label>
              <Input 
                type="date" 
                value={formData.due_date} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, due_date: e.target.value })} 
              />
            </div>
          </div>

          <div>
            <Label>Status Pembayaran</Label>
            <select 
              value={formData.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
            >
              <option value="Unpaid">Belum Dibayar (Unpaid)</option>
              <option value="Partial">Dibayar Sebagian (Partial)</option>
              <option value="Paid">Lunas (Paid)</option>
              <option value="Canceled">Dibatalkan (Canceled)</option>
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
              {isSubmitting ? "Menyimpan..." : (isEdit ? "Update Tagihan" : "Buat Tagihan")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}