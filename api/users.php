<?php
require_once __DIR__ . '/conf/db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'read':
        // Query untuk mengambil user dan nama role-nya
        $query = "SELECT u.id, u.name, u.email, u.nia, u.created_at, r.role_name 
                  FROM users u 
                  JOIN roles r ON u.role_id = r.id 
                  ORDER BY u.id DESC";
                  
        $result = $conn->query($query);
        
        $data = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
        }
        
        echo json_encode(["status" => "success", "data" => $data]);
        break;

    case 'create':
        // Menangkap data JSON dari React
        $data = json_decode(file_get_contents("php://input"));

        // Validasi input sederhana
        if(empty($data->name) || empty($data->email) || empty($data->password)) {
            echo json_encode(["status" => "error", "message" => "Nama, Email, dan Password wajib diisi."]);
            break;
        }

        $name = $conn->real_escape_string($data->name);
        $email = $conn->real_escape_string($data->email);
        $role_id = intval($data->role_id);
        $nia = !empty($data->nia) ? $conn->real_escape_string($data->nia) : NULL;
        
        // Enkripsi password menggunakan bcrypt
        $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);

        // Cek apakah email sudah terdaftar
        $check_email = $conn->query("SELECT id FROM users WHERE email = '$email'");
        if ($check_email->num_rows > 0) {
            echo json_encode(["status" => "error", "message" => "Email sudah digunakan."]);
            break;
        }

        // Simpan ke database
        $stmt = $conn->prepare("INSERT INTO users (role_id, name, email, password, nia) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issss", $role_id, $name, $email, $hashed_password, $nia);
        
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "User berhasil ditambahkan."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan user."]);
        }
        
        $stmt->close();
        break;

    // TODO: Tambahkan case 'update', 'delete' nanti
    default:
        echo json_encode(["status" => "error", "message" => "Aksi tidak valid."]);
        break;
}

$conn->close();
?>