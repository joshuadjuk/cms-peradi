<?php
// Izinkan akses CORS (Cross-Origin Resource Sharing) dari React
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request (OPTIONS) dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Hubungkan ke database (Sesuaikan dengan path db.php kamu)
require_once 'conf/db.php'; 

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Karena Audit Log bersifat Read-Only, kita HANYA menyediakan fungsi READ
if ($action === 'read') {
    try {
        // Ambil data log, urutkan dari yang paling baru (DESC)
        $query = "SELECT id, user_name, action, module, description, ip_address, DATE_FORMAT(created_at, '%d %b %Y, %H:%i') as created_at FROM activity_logs ORDER BY id DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $logs = [];
        
        while ($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $logs
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "message" => "Terjadi kesalahan pada server: " . $e->getMessage()
        ]);
    }
} 
// Fungsi untuk MENCATAT log (Dipanggil dari dalam file PHP lain, BUKAN dari frontend)
// Nanti fungsi ini bisa di-include di invoices.php, users.php, dll
else if ($action === 'create_log') {
    // Memastikan hanya POST request yang diterima
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->user_id) && !empty($data->user_name) && !empty($data->action) && !empty($data->module) && !empty($data->description)) {
            
            $ip_address = $_SERVER['REMOTE_ADDR'];
            
            $query = "INSERT INTO activity_logs (user_id, user_name, action, module, description, ip_address) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("isssss", $data->user_id, $data->user_name, $data->action, $data->module, $data->description, $ip_address);
            
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Log tercatat"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal mencatat log"]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
        }
    }
}
else {
    echo json_encode([
        "status" => "error",
        "message" => "Aksi tidak ditemukan atau tidak diizinkan"
    ]);
}
?>