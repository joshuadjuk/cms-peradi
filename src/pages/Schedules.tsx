import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

interface CaseData {
  id: number;
  title: string;
}

interface ScheduleRawData {
  id: number;
  status: string;
  case_title: string;
  agenda: string;
  schedule_date: string;
  schedule_time: string;
  location: string;
}

// Menyesuaikan struktur event FullCalendar dengan DB kita
interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string; // Warna untuk status
    location: string;
    time: string;
    case_title: string;
  };
}

const Schedules: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // State Form Jadwal Sidang
  const [formData, setFormData] = useState({
    case_id: "",
    agenda: "",
    schedule_date: "",
    schedule_time: "09:00",
    location: "",
    status: "Scheduled", // Scheduled, Completed, Postponed, Canceled
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fungsi Fetch Jadwal & Konversi ke format FullCalendar
  const fetchSchedules = async () => {
    try {
      const response = await fetch("http://localhost:8000/schedules.php?action=read");
      const data = await response.json();
      if (data.status === "success") {
        const formattedEvents: CalendarEvent[] = data.data.map((item: ScheduleRawData) => {
          // Tentukan warna berdasarkan status
          let color = "Primary";
          if (item.status === "Completed") color = "Success";
          if (item.status === "Postponed") color = "Warning";
          if (item.status === "Canceled") color = "Danger";

          return {
            id: item.id.toString(),
            title: `${item.case_title} - ${item.agenda}`, // Judul di kalender
            start: `${item.schedule_date}T${item.schedule_time}`, // Format ISO 8601
            allDay: false,
            extendedProps: { 
              calendar: color,
              location: item.location,
              time: item.schedule_time,
              case_title: item.case_title
            },
          };
        });
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Gagal mengambil jadwal:", error);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await fetch("http://localhost:8000/cases.php?action=read");
      const data = await response.json();
      if (data.status === "success") setCases(data.data);
    } catch (error) {
      console.error("Gagal mengambil opsi perkara:", error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchCases();
  }, []);

  // Saat tanggal di kalender diklik kosong (untuk nambah jadwal baru)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setFormData({ ...formData, schedule_date: selectInfo.startStr });
    openModal();
  };

  // Saat event yang sudah ada diklik (sementara kita buat view only)
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    alert(`Agenda: ${event.title}\nLokasi: ${event.extendedProps.location}\nWaktu: ${event.extendedProps.time}`);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.case_id || !formData.agenda || !formData.schedule_date) {
      alert("Perkara, Agenda, dan Tanggal wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:8000/schedules.php?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.status === "success") {
        fetchSchedules(); // Refresh Kalender
        closeModal();
        setFormData({ ...formData, agenda: "", location: "", notes: "" }); // Reset sebagian
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Jadwal Sidang & Agenda" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 sm:p-6">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height={700}
            customButtons={{
              addEventButton: {
                text: "+ Tambah Jadwal",
                click: openModal,
              },
            }}
          />
        </div>

        {/* Modal Tambah Jadwal */}
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] p-6 lg:p-10">
          <div className="flex flex-col overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                Tambah Jadwal Sidang/Agenda
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pilih tanggal dan perkara untuk menambahkan agenda baru.
              </p>
            </div>
            
            <form onSubmit={handleAddEvent} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Terkait Perkara <span className="text-error-500">*</span>
                </label>
                <select 
                  value={formData.case_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, case_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">-- Pilih Kasus --</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nama Agenda (Contoh: Sidang Mediasi) <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.agenda}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, agenda: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formData.schedule_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, schedule_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Waktu
                  </label>
                  <input
                    type="time"
                    value={formData.schedule_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, schedule_time: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Lokasi / Pengadilan
                </label>
                <input
                  type="text"
                  placeholder="PN Jakarta Selatan Ruang 3"
                  value={formData.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>

              <div className="flex items-center gap-3 mt-6 justify-end">
                <button
                  onClick={closeModal}
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </>
  );
};

// Fungsi Render Event (Diberi tipe data yang benar agar tidak error ESLint)
const renderEventContent = (eventInfo: EventContentArg) => {
  // Ambil warna dari extendedProps
  const colorType = eventInfo.event.extendedProps.calendar?.toLowerCase() || 'primary';
  const colorClass = `fc-bg-${colorType}`;
  
  return (
    <div className={`event-fc-color flex flex-col fc-event-main ${colorClass} p-1 rounded-sm w-full overflow-hidden text-xs`}>
      <div className="font-semibold truncate">{eventInfo.timeText}</div>
      <div className="truncate whitespace-normal leading-tight">{eventInfo.event.title}</div>
    </div>
  );
};

export default Schedules;