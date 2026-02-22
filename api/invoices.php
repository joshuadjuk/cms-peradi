<?php
require_once __DIR__ . '/conf/db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'read':
        // Join 3 tabel: invoices -> cases -> clients
        $query = "SELECT i.id, i.case_id, i.invoice_number, i.title, i.amount, i.type, i.status, i.due_date, i.created_at, 
                         c.title AS case_title, cl.name AS client_name 
                  FROM invoices i 
                  JOIN cases c ON i.case_id = c.id 
                  JOIN clients cl ON c.client_id = cl.id 
                  ORDER BY i.id DESC";
        $result = $conn->query($query);
        $data = [];
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
        break;

    case 'create':
        $data = json_decode(file_get_contents("php://input"));
        if(empty($data->case_id) || empty($data->invoice_number) || empty($data->title) || empty($data->amount)) {
            echo json_encode(["status" => "error", "message" => "Perkara, Nomor Invoice, Judul, dan Nominal wajib diisi."]);
            break;
        }
        
        $case_id = intval($data->case_id);
        $invoice_number = $conn->real_escape_string($data->invoice_number);
        $title = $conn->real_escape_string($data->title);
        $amount = floatval($data->amount); // Format ke desimal
        $type = $conn->real_escape_string($data->type);
        $status = $conn->real_escape_string($data->status);
        $due_date = $conn->real_escape_string($data->due_date);
        
        $stmt = $conn->prepare("INSERT INTO invoices (case_id, invoice_number, title, amount, type, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("issdsss", $case_id, $invoice_number, $title, $amount, $type, $status, $due_date);
        
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Invoice berhasil dibuat."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal membuat invoice."]);
        }
        $stmt->close();
        break;

    case 'update':
        $data = json_decode(file_get_contents("php://input"));
        if(empty($data->id) || empty($data->case_id) || empty($data->title) || empty($data->amount)) {
            echo json_encode(["status" => "error", "message" => "Data tidak lengkap untuk diupdate."]);
            break;
        }
        
        $id = intval($data->id);
        $case_id = intval($data->case_id);
        $invoice_number = $conn->real_escape_string($data->invoice_number);
        $title = $conn->real_escape_string($data->title);
        $amount = floatval($data->amount);
        $type = $conn->real_escape_string($data->type);
        $status = $conn->real_escape_string($data->status);
        $due_date = $conn->real_escape_string($data->due_date);
        
        $stmt = $conn->prepare("UPDATE invoices SET case_id=?, invoice_number=?, title=?, amount=?, type=?, status=?, due_date=? WHERE id=?");
        $stmt->bind_param("issdsssi", $case_id, $invoice_number, $title, $amount, $type, $status, $due_date, $id);
        
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Invoice berhasil diperbarui."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal memperbarui invoice."]);
        }
        $stmt->close();
        break;

    case 'delete':
        $data = json_decode(file_get_contents("php://input"));
        $id = isset($data->id) ? intval($data->id) : 0;
        
        $stmt = $conn->prepare("DELETE FROM invoices WHERE id = ?");
        $stmt->bind_param("i", $id);
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Invoice berhasil dihapus."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus invoice."]);
        }
        $stmt->close();
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Aksi tidak valid."]);
        break;
}
$conn->close();
?>