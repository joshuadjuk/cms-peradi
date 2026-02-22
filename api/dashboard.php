<?php
require_once __DIR__ . '/conf/db.php';

// Hitung Total Kasus
$res_cases = $conn->query("SELECT COUNT(id) as total FROM cases");
$total_cases = $res_cases->fetch_assoc()['total'];

// Hitung Total Klien
$res_clients = $conn->query("SELECT COUNT(id) as total FROM clients");
$total_clients = $res_clients->fetch_assoc()['total'];

// Hitung Jadwal Sidang ke depan (Hari ini dan seterusnya)
$res_schedules = $conn->query("SELECT COUNT(id) as total FROM schedules WHERE schedule_date >= CURDATE()");
$upcoming_schedules = $res_schedules->fetch_assoc()['total'];

// Hitung Total User (Khusus untuk Super Admin)
$res_users = $conn->query("SELECT COUNT(id) as total FROM users");
$total_users = $res_users->fetch_assoc()['total'];

echo json_encode([
    "status" => "success",
    "data" => [
        "total_cases" => intval($total_cases),
        "total_clients" => intval($total_clients),
        "upcoming_schedules" => intval($upcoming_schedules),
        "total_users" => intval($total_users)
    ]
]);

$conn->close();
?>