import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";

interface User {
  id: number;
  name: string;
  email: string;
  role_name: string;
  nia: string | null;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hook Modal untuk Tambah User
  const { isOpen, openModal, closeModal } = useModal();

  // State untuk form Tambah User
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "4", // Default: Associate
    nia: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ error: false, text: "" });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/users.php?action=read");
      const data = await response.json();
      if (data.status === "success") {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data user:", error); // Variabel error terpakai di sini
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Manual sebagai pengganti atribut 'required' di tag Input
    if (!formData.name || !formData.email || !formData.password) {
      setFormMessage({ error: true, text: "Nama, Email, dan Password wajib diisi." });
      return;
    }

    setIsSubmitting(true);
    setFormMessage({ error: false, text: "" });

    try {
      const response = await fetch("http://localhost:8000/users.php?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status === "success") {
        setFormMessage({ error: false, text: data.message });
        fetchUsers(); // Refresh tabel setelah berhasil
        
        // Tutup modal dan reset form setelah 1 detik
        setTimeout(() => {
          closeModal();
          setFormData({ name: "", email: "", password: "", role_id: "4", nia: "" });
          setFormMessage({ error: false, text: "" });
        }, 1000);
      } else {
        setFormMessage({ error: true, text: data.message });
      }
    } catch (error) {
      console.error(error); // Variabel error terpakai di sini
      setFormMessage({ error: true, text: "Gagal terhubung ke server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Pengaturan User" />

      {/* Header Halaman */}
      <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Daftar Pengguna</h2>
          <p className="text-sm text-gray-500">Manajemen akun advokat dan staf.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={openModal} size="sm">
            + Tambah User
          </Button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama User</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jabatan (Role)</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NIA</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Aksi</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={5}>Memuat data...</td>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <td className="px-5 py-4 text-center text-sm text-gray-500" colSpan={5}>Belum ada data user.</td>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold dark:bg-brand-900 dark:text-brand-300">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{user.email}</TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <Badge size="sm" color={user.role_name === "Super Admin" ? "error" : user.role_name === "Managing Partner" ? "success" : "primary"}>
                        {user.role_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{user.nia || "-"}</TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <button className="text-brand-500 hover:text-brand-700 text-sm font-medium mr-3">Edit</button>
                      <button className="text-error-500 hover:text-error-700 text-sm font-medium">Hapus</button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Tambah User */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Tambah Pengguna Baru</h3>
        
        {formMessage.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${formMessage.error ? 'bg-error-50 text-error-600' : 'bg-success-50 text-success-600'}`}>
            {formMessage.text}
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <Label>Nama Lengkap <span className="text-error-500">*</span></Label>
            <Input 
              type="text" 
              placeholder="Masukkan nama" 
              value={formData.name} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>
          
          <div>
            <Label>Email <span className="text-error-500">*</span></Label>
            <Input 
              type="email" 
              placeholder="email@peradi.id" 
              value={formData.email} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })} 
            />
          </div>

          <div>
            <Label>Password <span className="text-error-500">*</span></Label>
            <Input 
              type="password" 
              placeholder="Minimal 6 karakter" 
              value={formData.password} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Jabatan / Hak Akses</Label>
              <select 
                value={formData.role_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
              >
                <option value="1">Super Admin</option>
                <option value="2">Managing Partner</option>
                <option value="3">Lead Lawyer</option>
                <option value="4">Associate</option>
                <option value="5">Paralegal</option>
                <option value="6">Finance</option>
              </select>
            </div>
            
            <div>
              <Label>NIA (Opsional)</Label>
              <Input 
                type="text" 
                placeholder="No. Induk Advokat" 
                value={formData.nia} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nia: e.target.value })} 
              />
            </div>
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
              {isSubmitting ? "Menyimpan..." : "Simpan User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}