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
?>