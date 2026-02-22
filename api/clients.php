<?php
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
        $identity_number = $conn->real_escape_string($data->identity_number);
        $phone = $conn->real_escape_string($data->phone);
        $address = $conn->real_escape_string($data->address);
        
        // Simpan ke database
        $stmt = $conn->prepare("INSERT INTO clients (type, name, identity_number, phone, address) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $type, $name, $identity_number, $phone, $address);
        
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Data klien berhasil ditambahkan."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan data klien."]);
        }
        
        $stmt->close();
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Aksi tidak valid."]);
        break;
}

$conn->close();
?>