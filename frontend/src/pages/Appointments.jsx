import React, { useEffect, useState } from "react";

const API = "http://127.0.0.1:5000/api";

const emptyForm = {
  appointment_id: "",
  patient_id: "",
  doctor_id: "",
  appointment_date: "",
  appointment_time: "",
  reason: "",
  status: "Scheduled",
};

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentRes, patientRes, doctorRes] = await Promise.all([
        fetch(`${API}/appointments`),
        fetch(`${API}/patients`),
        fetch(`${API}/doctors`),
      ]);

      const appointmentData = await appointmentRes.json();
      const patientData = await patientRes.json();
      const doctorData = await doctorRes.json();

      if (!appointmentRes.ok) {
        throw new Error(
          appointmentData.error || "Failed to load appointments"
        );
      }

      if (!patientRes.ok) {
        throw new Error(
          patientData.error || "Failed to load patients"
        );
      }

      if (!doctorRes.ok) {
        throw new Error(
          doctorData.error || "Failed to load doctors"
        );
      }

      setAppointments(
        Array.isArray(appointmentData)
          ? appointmentData
          : appointmentData.appointments || []
      );

      setPatients(
        Array.isArray(patientData)
          ? patientData
          : patientData.patients || []
      );

      setDoctors(
        Array.isArray(doctorData)
          ? doctorData
          : doctorData.doctors || []
      );
    } catch (err) {
      setError(err.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------
  // CLEAR MESSAGES
  // --------------------------------------------------

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // HANDLE INPUT
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearMessages();
  };

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const validateForm = () => {
    if (!form.appointment_id.trim()) {
      return "Appointment ID is required.";
    }

    if (form.appointment_id.trim().length < 2) {
      return "Appointment ID must contain at least 2 characters.";
    }

    if (!form.patient_id) {
      return "Please select a patient.";
    }

    if (!form.doctor_id) {
      return "Please select a doctor.";
    }

    if (!form.appointment_date) {
      return "Please select appointment date.";
    }

    if (!form.appointment_time) {
      return "Please select appointment time.";
    }

    if (!form.reason.trim()) {
      return "Please enter appointment reason.";
    }

    if (form.reason.trim().length < 2) {
      return "Appointment reason is too short.";
    }

    const selectedDateTime = new Date(
      `${form.appointment_date}T${form.appointment_time}`
    );

    if (Number.isNaN(selectedDateTime.getTime())) {
      return "Invalid appointment date or time.";
    }

    if (!editingId && selectedDateTime < new Date()) {
      return "New appointment cannot be created in the past.";
    }

    const duplicate = appointments.find((appointment) => {
      if (editingId && appointment.id === editingId) {
        return false;
      }

      return (
        String(appointment.doctor_id) === String(form.doctor_id) &&
        String(appointment.appointment_date).slice(0, 10) ===
          form.appointment_date &&
        String(appointment.appointment_time).slice(0, 5) ===
          form.appointment_time &&
        appointment.status !== "Cancelled"
      );
    });

    if (duplicate) {
      return "This doctor already has an appointment at this date and time.";
    }

    return "";
  };

  // --------------------------------------------------
  // ADD / UPDATE
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    clearMessages();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API}/appointments/${editingId}`
        : `${API}/appointments`;

      const method = editingId ? "PUT" : "POST";

      const payload = {
        appointment_id: form.appointment_id.trim(),
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        reason: form.reason.trim(),
        status: form.status,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to save appointment."
        );
      }

      if (editingId) {
        setSuccess("Appointment updated successfully.");
      } else {
        setSuccess("Appointment added successfully.");
      }

      setForm(emptyForm);
      setEditingId(null);

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to save appointment.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  const handleEdit = (appointment) => {
    clearMessages();

    setEditingId(appointment.id);

    setForm({
      appointment_id: appointment.appointment_id || "",
      patient_id: appointment.patient_id || "",
      doctor_id: appointment.doctor_id || "",
      appointment_date: appointment.appointment_date
        ? String(appointment.appointment_date).slice(0, 10)
        : "",
      appointment_time: appointment.appointment_time
        ? String(appointment.appointment_time).slice(0, 5)
        : "",
      reason: appointment.reason || "",
      status: appointment.status || "Scheduled",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // --------------------------------------------------
  // CANCEL EDIT
  // --------------------------------------------------

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    clearMessages();
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      clearMessages();

      const response = await fetch(`${API}/appointments/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to delete appointment."
        );
      }

      setSuccess("Appointment deleted successfully.");

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete appointment.");
    } finally {
      setDeletingId(null);
    }
  };

  // --------------------------------------------------
  // STATUS UPDATE
  // --------------------------------------------------

  const handleStatusChange = async (appointment, newStatus) => {
    try {
      clearMessages();

      const response = await fetch(
        `${API}/appointments/${appointment.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointment_id: appointment.appointment_id,
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            appointment_date: String(
              appointment.appointment_date
            ).slice(0, 10),
            appointment_time: String(
              appointment.appointment_time
            ).slice(0, 5),
            reason: appointment.reason || "",
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to update status."
        );
      }

      setSuccess(`Appointment marked as ${newStatus}.`);

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update appointment status.");
    }
  };

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredAppointments = appointments.filter((appointment) => {
    const searchText = search.toLowerCase();

    const appointmentId = String(
      appointment.appointment_id || ""
    ).toLowerCase();

    const patientId = String(
      appointment.patient_id || ""
    ).toLowerCase();

    const doctorId = String(
      appointment.doctor_id || ""
    ).toLowerCase();

    const reason = String(
      appointment.reason || ""
    ).toLowerCase();

    const status = String(
      appointment.status || ""
    ).toLowerCase();

    return (
      appointmentId.includes(searchText) ||
      patientId.includes(searchText) ||
      doctorId.includes(searchText) ||
      reason.includes(searchText) ||
      status.includes(searchText)
    );
  });

  // --------------------------------------------------
  // HELPER FUNCTIONS
  // --------------------------------------------------

  const getPatientName = (patientId) => {
    const patient = patients.find(
      (p) => String(p.patient_id) === String(patientId)
    );

    return patient
      ? patient.name
      : patientId || "-";
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(
      (d) => String(d.doctor_id) === String(doctorId)
    );

    return doctor
      ? doctor.name
      : doctorId || "-";
  };

  const getStatusClass = (status) => {
    if (status === "Completed") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Cancelled") {
      return "bg-red-100 text-red-700";
    }

    if (status === "In Progress") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  const totalAppointments = appointments.length;

  const scheduledAppointments = appointments.filter(
    (a) => a.status === "Scheduled"
  ).length;

  const completedAppointments = appointments.filter(
    (a) => a.status === "Completed"
  ).length;

  const cancelledAppointments = appointments.filter(
    (a) => a.status === "Cancelled"
  ).length;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Appointment Management
        </h1>

        <p className="text-gray-500 mt-1">
          Manage patient appointments, doctor schedules and appointment status.
        </p>
      </div>

      {/* SUCCESS */}

      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-sm">
            Total Appointments
          </p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {totalAppointments}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-sm">
            Scheduled
          </p>

          <h2 className="text-3xl font-bold text-indigo-600 mt-2">
            {scheduledAppointments}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-sm">
            Completed
          </p>

          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {completedAppointments}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-sm">
            Cancelled
          </p>

          <h2 className="text-3xl font-bold text-red-600 mt-2">
            {cancelledAppointments}
          </h2>
        </div>

      </div>

      {/* FORM */}

      <div className="bg-white rounded-xl shadow p-5 md:p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {editingId
                ? "Edit Appointment"
                : "Create Appointment"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Enter appointment details below.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel Edit
            </button>
          )}

        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >

          {/* APPOINTMENT ID */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment ID
            </label>

            <input
              type="text"
              name="appointment_id"
              value={form.appointment_id}
              onChange={handleChange}
              placeholder="Example: APP-001"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* PATIENT */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient
            </label>

            <select
              name="patient_id"
              value={form.patient_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">
                Select Patient
              </option>

              {patients.map((patient) => (
                <option
                  key={patient.id || patient.patient_id}
                  value={patient.patient_id}
                >
                  {patient.patient_id} - {patient.name}
                </option>
              ))}
            </select>
          </div>

          {/* DOCTOR */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor
            </label>

            <select
              name="doctor_id"
              value={form.doctor_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">
                Select Doctor
              </option>

              {doctors.map((doctor) => (
                <option
                  key={doctor.id || doctor.doctor_id}
                  value={doctor.doctor_id}
                >
                  {doctor.doctor_id} - Dr. {doctor.name}
                </option>
              ))}
            </select>
          </div>

          {/* DATE */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Date
            </label>

            <input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
              min={
                !editingId
                  ? new Date().toISOString().split("T")[0]
                  : undefined
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* TIME */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Time
            </label>

            <input
              type="time"
              name="appointment_time"
              value={form.appointment_time}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* STATUS */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Scheduled">
                Scheduled
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>
          </div>

          {/* REASON */}

          <div className="md:col-span-2 lg:col-span-3">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason / Symptoms
            </label>

            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows="3"
              placeholder="Example: Fever, regular checkup, follow-up..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

          </div>

          {/* BUTTON */}

          <div className="md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-3">

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Appointment"
                : "Add Appointment"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Clear
              </button>
            )}

          </div>

        </form>
      </div>

      {/* SEARCH */}

      <div className="bg-white rounded-xl shadow p-5">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Appointment List
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Search and manage appointments.
            </p>
          </div>

          <div className="w-full md:w-96">

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appointment, patient, doctor..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-10 text-center">

            <p className="text-gray-500 text-lg">
              No appointments found.
            </p>

            <p className="text-gray-400 text-sm mt-2">
              Create a new appointment using the form above.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead className="bg-gray-100">

                <tr>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Appointment
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Patient
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Doctor
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Time
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Reason
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200">

                {filteredAppointments.map((appointment) => (

                  <tr
                    key={appointment.id}
                    className="hover:bg-gray-50"
                  >

                    {/* APPOINTMENT */}

                    <td className="px-5 py-4">

                      <div className="font-semibold text-gray-800">
                        {appointment.appointment_id}
                      </div>

                      <div className="text-xs text-gray-400">
                        ID: {appointment.id}
                      </div>

                    </td>

                    {/* PATIENT */}

                    <td className="px-5 py-4">

                      <div className="font-medium text-gray-800">
                        {getPatientName(appointment.patient_id)}
                      </div>

                      <div className="text-xs text-gray-400">
                        {appointment.patient_id}
                      </div>

                    </td>

                    {/* DOCTOR */}

                    <td className="px-5 py-4">

                      <div className="font-medium text-gray-800">
                        Dr. {getDoctorName(appointment.doctor_id)}
                      </div>

                      <div className="text-xs text-gray-400">
                        {appointment.doctor_id}
                      </div>

                    </td>

                    {/* DATE */}

                    <td className="px-5 py-4 text-gray-700">
                      {String(
                        appointment.appointment_date || "-"
                      ).slice(0, 10)}
                    </td>

                    {/* TIME */}

                    <td className="px-5 py-4 text-gray-700">
                      {String(
                        appointment.appointment_time || "-"
                      ).slice(0, 5)}
                    </td>

                    {/* REASON */}

                    <td className="px-5 py-4 max-w-[220px]">

                      <div className="truncate text-gray-700">
                        {appointment.reason || "-"}
                      </div>

                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">

                      <select
                        value={
                          appointment.status || "Scheduled"
                        }
                        onChange={(e) =>
                          handleStatusChange(
                            appointment,
                            e.target.value
                          )
                        }
                        className={`px-3 py-2 rounded-full text-sm font-semibold border-0 ${getStatusClass(
                          appointment.status
                        )}`}
                      >

                        <option value="Scheduled">
                          Scheduled
                        </option>

                        <option value="In Progress">
                          In Progress
                        </option>

                        <option value="Completed">
                          Completed
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>

                      </select>

                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-4">

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(appointment)
                          }
                          className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-yellow-600"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(appointment.id)
                          }
                          disabled={
                            deletingId === appointment.id
                          }
                          className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === appointment.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Appointments;