<?php
// Izinkan akses CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/conf/db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'read':
        $query = "SELECT * FROM clients ORDER BY id DESC";
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
        $data = json_decode(file_get_contents("php://input"));

        // Validasi input
        if(empty($data->name) || empty($data->type) || empty($data->phone)) {
            echo json_encode(["status" => "error", "message" => "Tipe, Nama, dan No. HP wajib diisi."]);
            break;
        }

        $type = $conn->real_escape_string($data->type);
        $name = $conn->real_escape_string($data->name);
        // Tambahan isset untuk menghindari error jika field kosong dari frontend
        $identity_number = isset($data->identity_number) ? $conn->real_escape_string($data->identity_number) : '';
        $phone = $conn->real_escape_string($data->phone);
        $address = isset($data->address) ? $conn->real_escape_string($data->address) : '';
        
        // Simpan ke database
        $stmt = $conn->prepare("INSERT INTO clients (type, name, identity_number, phone, address) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $type, $name, $identity_number, $phone, $address);
        
        if($stmt->execute()) {
            // ==========================================
            // LOG: CATAT PENAMBAHAN KLIEN BARU
            // ==========================================
            $user_id = isset($data->user_id) ? intval($data->user_id) : 0;
            $user_name = isset($data->user_name) ? $conn->real_escape_string($data->user_name) : 'System';
            $desc = "Menambahkan klien baru: " . $name . " (Tipe: " . $type . ", No HP: " . $phone . ")";
            
            catatLog($conn, $user_id, $user_name, 'Create', 'Data Klien', $desc);
            // ==========================================

            echo json_encode(["status" => "success", "message" => "Data klien berhasil ditambahkan."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan data klien."]);
        }
        
        $stmt->close();
        break;

    // Jika ke depannya kamu menambahkan fitur UPDATE atau DELETE untuk klien,
    // jangan lupa tambahkan catatLog() di dalamnya dengan cara yang sama!

    default:
        echo json_encode(["status" => "error", "message" => "Aksi tidak valid."]);
        break;
}

$conn->close();
?>