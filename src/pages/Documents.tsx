import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";

// Definisi tipe data
interface DocumentData {
  id: number;
  title: string;
  file_path: string;
  doc_type: string;
  status: string;
  case_title: string;
  uploader_name: string;
}

interface CaseData {
  id: number;
  title: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isOpen, openModal, closeModal } = useModal();

  // State untuk form (termasuk file)
  const [formData, setFormData] = useState({
    case_id: "",
    title: "",
    doc_type: "Surat Kuasa",
    status: "Draft",
  });
  const [file, setFile] = useState<File | null>(null); // State khusus untuk menyimpan file
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ error: false, text: "" });

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/documents.php?action=read");
      const data = await response.json();
      if (data.status === "success") {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data dokumen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await fetch("http://localhost:8000/cases.php?action=read");
      const data = await response.json();
      if (data.status === "success") {
        setCases(data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil opsi perkara:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCases();
  }, []);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Manual
    if (!formData.case_id || !formData.title || !file) {
      setFormMessage({ error: true, text: "Perkara, Judul Dokumen, dan File wajib diisi." });
      return;
    }

    // Ambil ID User yang sedang login dari localStorage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setFormMessage({ error: true, text: "Sesi login tidak valid. Harap login ulang." });
      return;
    }
    const user = JSON.parse(storedUser);

    setIsSubmitting(true);
    setFormMessage({ error: false, text: "" });

    // Karena ada file, kita HARUS menggunakan FormData, bukan JSON.stringify()
    const uploadData = new FormData();
    uploadData.append("case_id", formData.case_id);
    uploadData.append("uploaded_by", user.id.toString());
    uploadData.append("title", formData.title);
    uploadData.append("doc_type", formData.doc_type);
    uploadData.append("status", formData.status);
    uploadData.append("file", file); // Masukkan file fisiknya

    try {
      // Perhatikan: Saat mengirim FormData, JANGAN set header "Content-Type".
      // Browser akan otomatis menyetelnya menjadi "multipart/form-data" dengan boundary yang tepat.
      const response = await fetch("http://localhost:8000/documents.php?action=create", {
        method: "POST",
        body: uploadData,
      });

      const data = await response.json();

      if (data.status === "success") {
        setFormMessage({ error: false, text: data.message });
        fetchDocuments(); // Refresh tabel
        
        setTimeout(() => {
          closeModal();
          setFormData({ case_id: "", title: "", doc_type: "Surat Kuasa", status: "Draft" });
          setFile(null); // Reset file
          setFormMessage({ error: false, text: "" });
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

  // Fungsi tipe badge
  type BadgeColor = "primary" | "success" | "warning" | "error" | "info";
  const getStatusColor = (status: string): BadgeColor => {
    return status === "Final" ? "success" : "warning";
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Dokumen & Bukti" />

      {/* Header */}
      <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Arsip Dokumen Perkara</h2>
          <p className="text-sm text-gray-500">Kelola berkas fisik, alat bukti, dan surat menyurat legal.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={openModal} size="sm">
            + Unggah Dokumen
          </Button>
        </div>
      </div>

      {/* Tabel Dokumen */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Judul Dokumen</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Terkait Perkara</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipe</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Diunggah Oleh</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Aksi</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={6}>Memuat data...</td>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={6}>Belum ada dokumen yang diunggah.</td>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start font-medium text-gray-800 dark:text-white/90">
                      {doc.title}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 truncate max-w-[200px]">
                      {doc.case_title}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {doc.doc_type}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {doc.uploader_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <Badge size="sm" color={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <a 
                        href={`http://localhost:8000/api/${doc.file_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-brand-500 hover:text-brand-700 text-sm font-medium mr-3"
                      >
                        Lihat/Unduh
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Upload Dokumen */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Unggah Dokumen Perkara</h3>
        
        {formMessage.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${formMessage.error ? 'bg-error-50 text-error-600' : 'bg-success-50 text-success-600'}`}>
            {formMessage.text}
          </div>
        )}

        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <Label>Terkait Perkara <span className="text-error-500">*</span></Label>
            <select 
              value={formData.case_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, case_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
            >
              <option value="">-- Pilih Kasus --</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Label>Judul Dokumen <span className="text-error-500">*</span></Label>
            <Input 
              type="text" 
              placeholder="Contoh: Surat Kuasa PT ABCD" 
              value={formData.title} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipe Dokumen</Label>
              <select 
                value={formData.doc_type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, doc_type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
              >
                <option value="Surat Kuasa">Surat Kuasa</option>
                <option value="Gugatan">Gugatan</option>
                <option value="Jawaban">Jawaban</option>
                <option value="Bukti">Alat Bukti</option>
                <option value="Putusan">Putusan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            
            <div>
              <Label>Status</Label>
              <select 
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
              >
                <option value="Draft">Draft</option>
                <option value="Final">Final</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Pilih File (PDF/DOC/JPG) <span className="text-error-500">*</span></Label>
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFile(e.target.files[0]);
                }
              }}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
            />
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
              {isSubmitting ? "Mengunggah..." : "Unggah Dokumen"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}