<?php
// Panggil koneksi database
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
                // Hapus field password sebelum dikirim ke Frontend demi keamanan
                unset($user['password']);

                echo json_encode([
                    "status" => "success",
                    "message" => "Login berhasil.",
                    "data" => $user
                ]);
            } else {
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

    default:
        echo json_encode(["status" => "error", "message" => "Action tidak valid. Gunakan ?action=login"]);
        break;
}

$conn->close();
?>