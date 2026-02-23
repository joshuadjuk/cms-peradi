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
        // Mengambil data dokumen beserta nama kasus dan nama uploader-nya
        $query = "SELECT d.id, d.title, d.file_path, d.doc_type, d.status, d.created_at, 
                         c.title AS case_title, u.name AS uploader_name 
                  FROM documents d 
                  JOIN cases c ON d.case_id = c.id 
                  JOIN users u ON d.uploaded_by = u.id 
                  ORDER BY d.id DESC";
                  
        $result = $conn->query($query);
        
        $data = [];
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
        }
        
        echo json_encode(["status" => "success", "data" => $data]);
        break;

    case 'create':
        // Karena kita mengunggah file, kita menggunakan $_POST dan $_FILES, bukan php://input JSON
        if (!isset($_POST['case_id']) || !isset($_POST['uploaded_by']) || !isset($_POST['title'])) {
            echo json_encode(["status" => "error", "message" => "Form tidak lengkap."]);
            break;
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(["status" => "error", "message" => "Harap pilih file dokumen untuk diunggah."]);
            break;
        }

        $case_id = intval($_POST['case_id']);
        $uploaded_by = intval($_POST['uploaded_by']);
        $title = $conn->real_escape_string($_POST['title']);
        $doc_type = $conn->real_escape_string($_POST['doc_type']);
        $status = $conn->real_escape_string($_POST['status']);
        
        // Proses Upload File
        $file_tmp = $_FILES['file']['tmp_name'];
        $file_name = $_FILES['file']['name'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        // Batasi tipe file yang boleh diunggah (demi keamanan)
        $allowed_ext = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
        if (!in_array($file_ext, $allowed_ext)) {
            echo json_encode(["status" => "error", "message" => "Ekstensi file tidak diizinkan. Gunakan PDF/DOC/Image."]);
            break;
        }

        // Buat nama file unik agar tidak tertimpa jika ada file bernama sama
        $new_file_name = time() . '_' . rand(1000, 9999) . '.' . $file_ext;
        $upload_dir = __DIR__ . '/uploads/';
        $file_path = 'uploads/' . $new_file_name;

        // Pindahkan file dari temporary folder ke folder uploads kita
        if (move_uploaded_file($file_tmp, $upload_dir . $new_file_name)) {
            // Jika file berhasil diunggah, simpan datanya ke database
            $stmt = $conn->prepare("INSERT INTO documents (case_id, uploaded_by, title, file_path, doc_type, status) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("iissss", $case_id, $uploaded_by, $title, $file_path, $doc_type, $status);
            
            if($stmt->execute()) {
                
                // ==========================================
                // LOG: CATAT PENGUNGGAHAN DOKUMEN BARU
                // ==========================================
                // Tangkap user_name dari $_POST jika dikirim dari React
                $user_name = isset($_POST['user_name']) ? $conn->real_escape_string($_POST['user_name']) : 'System';
                $desc = "Mengunggah dokumen baru: " . $title . " (Tipe: " . $doc_type . ") untuk perkara ID " . $case_id;
                
                catatLog($conn, $uploaded_by, $user_name, 'Create', 'Dokumen & Bukti', $desc);
                // ==========================================

                echo json_encode(["status" => "success", "message" => "Dokumen berhasil diunggah."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal menyimpan ke database."]);
            }
            $stmt->close();
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal memindahkan file ke server."]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Aksi tidak valid."]);
        break;
}

$conn->close();
?>