<?php
require_once __DIR__ . '/conf/db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'read':
        // Perhatikan: Kita tambahkan c.client_id di sini
        $query = "SELECT c.id, c.client_id, c.case_number, c.title, c.type, c.status, c.created_at, cl.name AS client_name 
                  FROM cases c 
                  JOIN clients cl ON c.client_id = cl.id 
                  ORDER BY c.id DESC";
        $result = $conn->query($query);
        $data = [];
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
        break;

    case 'detail':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        $caseQuery = $conn->query("SELECT c.*, cl.name AS client_name, cl.phone, cl.type AS client_type, cl.identity_number 
                                   FROM cases c JOIN clients cl ON c.client_id = cl.id WHERE c.id = $id");
        $caseData = $caseQuery->fetch_assoc();

        if (!$caseData) {
            echo json_encode(["status" => "error", "message" => "Kasus tidak ditemukan."]);
            break;
        }

        $docsQuery = $conn->query("SELECT d.*, u.name AS uploader_name FROM documents d JOIN users u ON d.uploaded_by = u.id WHERE d.case_id = $id ORDER BY d.id DESC");
        $docsData = [];
        while($row = $docsQuery->fetch_assoc()) $docsData[] = $row;

        $schedQuery = $conn->query("SELECT * FROM schedules WHERE case_id = $id ORDER BY schedule_date ASC");
        $schedData = [];
        while($row = $schedQuery->fetch_assoc()) $schedData[] = $row;

        echo json_encode(["status" => "success", "data" => ["info" => $caseData, "documents" => $docsData, "schedules" => $schedData]]);
        break;

    case 'create':
        $data = json_decode(file_get_contents("php://input"));
        if(empty($data->client_id) || empty($data->title) || empty($data->type)) {
            echo json_encode(["status" => "error", "message" => "Klien, Judul Perkara, dan Tipe wajib diisi."]);
            break;
        }
        $client_id = intval($data->client_id);
        $title = $conn->real_escape_string($data->title);
        $type = $conn->real_escape_string($data->type);
        $status = $conn->real_escape_string($data->status);
        $case_number = !empty($data->case_number) ? $conn->real_escape_string($data->case_number) : NULL;
        
        $stmt = $conn->prepare("INSERT INTO cases (client_id, case_number, title, type, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issss", $client_id, $case_number, $title, $type, $status);
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Data perkara berhasil ditambahkan."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan perkara."]);
        }
        $stmt->close();
        break;

    case 'update':
        // FUNGSI BARU UNTUK EDIT DATA
        $data = json_decode(file_get_contents("php://input"));
        if(empty($data->id) || empty($data->client_id) || empty($data->title) || empty($data->type)) {
            echo json_encode(["status" => "error", "message" => "Data tidak lengkap untuk diupdate."]);
            break;
        }
        
        $id = intval($data->id);
        $client_id = intval($data->client_id);
        $title = $conn->real_escape_string($data->title);
        $type = $conn->real_escape_string($data->type);
        $status = $conn->real_escape_string($data->status);
        $case_number = !empty($data->case_number) ? $conn->real_escape_string($data->case_number) : NULL;
        
        $stmt = $conn->prepare("UPDATE cases SET client_id=?, case_number=?, title=?, type=?, status=? WHERE id=?");
        $stmt->bind_param("issssi", $client_id, $case_number, $title, $type, $status, $id);
        
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Data perkara berhasil diperbarui."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal memperbarui perkara."]);
        }
        $stmt->close();
        break;

    case 'delete':
        $data = json_decode(file_get_contents("php://input"));
        $id = isset($data->id) ? intval($data->id) : 0;
        
        $stmt = $conn->prepare("DELETE FROM cases WHERE id = ?");
        $stmt->bind_param("i", $id);
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Perkara berhasil dihapus secara permanen."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus perkara."]);
        }
        $stmt->close();
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Aksi tidak valid."]);
        break;
}
$conn->close();
?>