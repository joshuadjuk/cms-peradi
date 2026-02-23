<?php
// Izinkan akses CORS (Cross-Origin Resource Sharing) dari React (Opsional tapi disarankan)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request (OPTIONS) dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Panggil koneksi database (Pastikan di dalam db.php sudah ada fungsi catatLog ya!)
require_once './conf/db.php';

// Tangkap parameter 'action'. Defaultnya kosong.
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'login':
        // Tangkap input JSON dari React
        $data = json_decode(file_get_contents("php://input"));

        // Validasi input tidak boleh kosong
        if (empty($data->email) || empty($data->password)) {
            echo json_encode(["status" => "error", "message" => "Email dan Password wajib diisi."]);
            break;
        }

        $email = $conn->real_escape_string($data->email);
        $password = $data->password;

        // Cari user berdasarkan email dan join dengan tabel roles
        $query = "SELECT u.id, u.role_id, u.name, u.email, u.password, u.nia, r.role_name 
                  FROM users u 
                  JOIN roles r ON u.role_id = r.id 
                  WHERE u.email = ?";
                  
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();

            // Verifikasi password (menggunakan algoritma bcrypt)
            if (password_verify($password, $user['password'])) {
                
                // ==========================================
                // INTEGRASI LOG AKTIVITAS (AUDIT TRAIL)
                // ==========================================
                $deskripsi = "User berhasil login ke dalam sistem dengan Role: " . $user['role_name'];
                
                // Memanggil helper fungsi log yang ada di db.php
                catatLog($conn, $user['id'], $user['name'], 'Login', 'Autentikasi', $deskripsi);
                // ==========================================

                // Hapus field password sebelum dikirim ke Frontend demi keamanan
                unset($user['password']);

                echo json_encode([
                    "status" => "success",
                    "message" => "Login berhasil.",
                    "data" => $user
                ]);
            } else {
                // (Opsional) Kalau mau super ketat, salah password juga bisa dicatat log-nya di sini
                echo json_encode(["status" => "error", "message" => "Password yang Anda masukkan salah."]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Email tidak ditemukan di sistem."]);
        }
        
        $stmt->close();
        break;

    // Jika ke depannya butuh register, tambahkan di sini
    // case 'register': 
    //    ...
    //    break;
    case 'logout':
        // Tangkap input JSON dari React
        $data = json_decode(file_get_contents("php://input"));

        // Pastikan ada data user yang dikirim untuk dicatat di log
        if (!empty($data->id) && !empty($data->name)) {
            
            // ==========================================
            // INTEGRASI LOG AKTIVITAS (AUDIT TRAIL)
            // ==========================================
            $deskripsi = "User berhasil logout dari sistem.";
            
            // Panggil fungsi pencatat log
            catatLog($conn, $data->id, $data->name, 'Logout', 'Autentikasi', $deskripsi);
            // ==========================================

            echo json_encode(["status" => "success", "message" => "Logout berhasil dicatat."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Data user tidak valid untuk logout."]);
        }
        break;
        
    default:
        echo json_encode(["status" => "error", "message" => "Action tidak valid. Gunakan ?action=login"]);
        break;
}

$conn->close();
?>