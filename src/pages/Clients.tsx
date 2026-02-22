import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";

interface Client {
  id: number;
  type: string;
  name: string;
  identity_number: string;
  phone: string;
  address: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hook Modal untuk Tambah Klien
  const { isOpen, openModal, closeModal } = useModal();

  // State Form
  const [formData, setFormData] = useState({
    type: "Individu", // Default value
    name: "",
    identity_number: "",
    phone: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ error: false, text: "" });

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/clients.php?action=read");
      const data = await response.json();
      if (data.status === "success") {
        setClients(data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data klien:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Manual
    if (!formData.name || !formData.phone) {
      setFormMessage({ error: true, text: "Nama dan No. HP wajib diisi." });
      return;
    }

    setIsSubmitting(true);
    setFormMessage({ error: false, text: "" });

    try {
      const response = await fetch("http://localhost:8000/clients.php?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status === "success") {
        setFormMessage({ error: false, text: data.message });
        fetchClients(); // Refresh tabel
        
        setTimeout(() => {
          closeModal();
          setFormData({ type: "Individu", name: "", identity_number: "", phone: "", address: "" });
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

  return (
    <div>
      <PageBreadcrumb pageTitle="Data Klien" />

      {/* Header Halaman */}
      <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Daftar Klien</h2>
          <p className="text-sm text-gray-500">Manajemen data individu maupun korporasi.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={openModal} size="sm">
            + Tambah Klien
          </Button>
        </div>
      </div>

      {/* Tabel Data Klien */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Klien</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipe</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Identitas (NIK/NIB)</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kontak</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Aksi</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={5}>Memuat data...</td>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={5}>Belum ada data klien.</td>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {client.name}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <Badge size="sm" color={client.type === "Korporasi" ? "warning" : "primary"}>
                        {client.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {client.identity_number || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {client.phone}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <button className="text-brand-500 hover:text-brand-700 text-sm font-medium mr-3">Detail</button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Tambah Klien */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Tambah Data Klien</h3>
        
        {formMessage.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${formMessage.error ? 'bg-error-50 text-error-600' : 'bg-success-50 text-success-600'}`}>
            {formMessage.text}
          </div>
        )}

        <form onSubmit={handleCreateClient} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipe Klien</Label>
              <select 
                value={formData.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
              >
                <option value="Individu">Individu / Perorangan</option>
                <option value="Korporasi">Korporasi / Perusahaan</option>
              </select>
            </div>
            <div>
              <Label>Identitas (NIK/NIB) <span className="text-error-500">*</span></Label>
              <Input 
                type="text" 
                placeholder={formData.type === "Individu" ? "Masukkan NIK" : "Masukkan NIB/NPWP"}
                value={formData.identity_number} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, identity_number: e.target.value })} 
              />
            </div>
          </div>
          
          <div>
            <Label>Nama Lengkap / Nama Perusahaan <span className="text-error-500">*</span></Label>
            <Input 
              type="text" 
              placeholder="Masukkan nama" 
              value={formData.name} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>

          <div>
            <Label>Nomor Telepon / HP <span className="text-error-500">*</span></Label>
            <Input 
              type="text" 
              placeholder="08xxxxxxxxxx" 
              value={formData.phone} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })} 
            />
          </div>

          <div>
            <Label>Alamat Lengkap</Label>
            {/* Menggunakan textarea standar untuk alamat yang lebih leluasa */}
            <textarea
              placeholder="Masukkan alamat lengkap..."
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500 h-24 resize-none"
            ></textarea>
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
              {isSubmitting ? "Menyimpan..." : "Simpan Data Klien"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}