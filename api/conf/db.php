<?php
// Izinkan akses dari origin manapun (Penting untuk koneksi React -> PHP lokal)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request dari browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Konfigurasi Database
$host = "localhost";
$user = "root"; // Sesuaikan dengan user MySQL Anda
$pass = "";     // Sesuaikan dengan password MySQL Anda
$dbname = "cms-peradi"; // Sesuaikan dengan nama database Anda

// Membuat koneksi
$conn = new mysqli($host, $user, $pass, $dbname);

// Cek koneksi
if ($conn->connect_error) {
    die(json_encode([
        "status" => "error", 
        "message" => "Koneksi database gagal: " . $conn->connect_error
    ]));
}

// ... (kode koneksi database kamu yang sudah ada di atasnya) ...

// Tambahkan fungsi ini di baris paling bawah db.php
function catatLog($conn, $user_id, $user_name, $action, $module, $description) {
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $query = "INSERT INTO activity_logs (user_id, user_name, action, module, description, ip_address) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("isssss", $user_id, $user_name, $action, $module, $description, $ip_address);
    $stmt->execute();
}
?>