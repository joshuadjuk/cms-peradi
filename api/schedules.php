<?php
require_once __DIR__ . '/conf/db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'read':
        $query = "SELECT s.*, c.title as case_title 
                  FROM schedules s 
                  JOIN cases c ON s.case_id = c.id";
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
        $data = json_decode(file_get_contents("php://input"));

        if(empty($data->case_id) || empty($data->agenda) || empty($data->schedule_date)) {
            echo json_encode(["status" => "error", "message" => "Perkara, Agenda, dan Tanggal wajib diisi."]);
            break;
        }

        $case_id = intval($data->case_id);
        $agenda = $conn->real_escape_string($data->agenda);
        $schedule_date = $conn->real_escape_string($data->schedule_date);
        $schedule_time = !empty($data->schedule_time) ? $conn->real_escape_string($data->schedule_time) : '00:00:00';
        $location = $conn->real_escape_string($data->location);
        $status = $conn->real_escape_string($data->status);
        $notes = !empty($data->notes) ? $conn->real_escape_string($data->notes) : NULL;
        
        $stmt = $conn->prepare("INSERT INTO schedules (case_id, agenda, schedule_date, schedule_time, location, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("issssss", $case_id, $agenda, $schedule_date, $schedule_time, $location, $status, $notes);
        
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Jadwal berhasil ditambahkan."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan jadwal."]);
        }
        $stmt->close();
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Aksi tidak valid."]);
        break;
}
$conn->close();
?>