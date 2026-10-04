import React, { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:5000/api";

const initialForm = {
  admission_id: "",
  patient_id: "",
  doctor_id: "",
  bed_id: "",
  admission_date: "",
  admission_time: "",
  diagnosis: "",
  treatment_notes: "",
  status: "Admitted",
};

function Admission() {
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [beds, setBeds] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [dischargingId, setDischargingId] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [showForm, setShowForm] = useState(false);

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        admissionsResponse,
        patientsResponse,
        doctorsResponse,
        bedsResponse,
      ] = await Promise.all([
        fetch(`${API}/admissions`),
        fetch(`${API}/patients`),
        fetch(`${API}/doctors`),
        fetch(`${API}/beds`),
      ]);

      const admissionsData = await admissionsResponse.json();
      const patientsData = await patientsResponse.json();
      const doctorsData = await doctorsResponse.json();
      const bedsData = await bedsResponse.json();

      if (!admissionsResponse.ok) {
        throw new Error(
          admissionsData.error || "Failed to load admissions"
        );
      }

      if (!patientsResponse.ok) {
        throw new Error(
          patientsData.error || "Failed to load patients"
        );
      }

      if (!doctorsResponse.ok) {
        throw new Error(
          doctorsData.error || "Failed to load doctors"
        );
      }

      if (!bedsResponse.ok) {
        throw new Error(
          bedsData.error || "Failed to load beds"
        );
      }

      setAdmissions(Array.isArray(admissionsData) ? admissionsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      setBeds(Array.isArray(bedsData) ? bedsData : []);
    } catch (error) {
      setMessage(error.message || "Failed to load data");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = () => {
    if (!form.admission_id.trim()) {
      return "Admission ID is required";
    }

    if (form.admission_id.trim().length < 2) {
      return "Admission ID must contain at least 2 characters";
    }

    if (!form.patient_id) {
      return "Please select a patient";
    }

    if (!form.admission_date) {
      return "Admission date is required";
    }

    if (!form.diagnosis.trim()) {
      return "Diagnosis is required";
    }

    if (form.diagnosis.trim().length < 2) {
      return "Diagnosis must contain at least 2 characters";
    }

    if (!editingId && form.status === "Discharged") {
      return "New admission cannot be created as Discharged";
    }

    if (form.status === "Discharged" && !editingId) {
      return "Please create the admission first and then discharge it";
    }

    if (form.bed_id) {
      const selectedBed = beds.find(
        (bed) => bed.bed_id === form.bed_id
      );

      if (!selectedBed) {
        return "Selected bed was not found";
      }

      if (
        selectedBed.status !== "Available" &&
        selectedBed.bed_id !==
          admissions.find((a) => a.id === editingId)?.bed_id
      ) {
        return "Selected bed is not available";
      }
    }

    return "";
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API}/admissions/${editingId}`
        : `${API}/admissions`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admission_id: form.admission_id.trim(),
          patient_id: form.patient_id,
          doctor_id: form.doctor_id || null,
          bed_id: form.bed_id || null,
          admission_date: form.admission_date,
          admission_time: form.admission_time || null,
          diagnosis: form.diagnosis.trim(),
          treatment_notes: form.treatment_notes.trim(),
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to save admission"
        );
      }

      setMessage(
        editingId
          ? "Admission updated successfully"
          : "Patient admitted successfully"
      );

      setMessageType("success");

      setForm(initialForm);
      setEditingId(null);
      setShowForm(false);

      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to save admission");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (admission) => {
    if (admission.status === "Discharged") {
      setMessage(
        "Discharged admission cannot be edited from here"
      );
      setMessageType("error");
      return;
    }

    setEditingId(admission.id);

    setForm({
      admission_id: admission.admission_id || "",
      patient_id: admission.patient_id || "",
      doctor_id: admission.doctor_id || "",
      bed_id: admission.bed_id || "",
      admission_date: admission.admission_date || "",
      admission_time: admission.admission_time
        ? admission.admission_time.slice(0, 5)
        : "",
      diagnosis: admission.diagnosis || "",
      treatment_notes: admission.treatment_notes || "",
      status: admission.status || "Admitted",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
    setMessage("");
    setMessageType("");
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this admission?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(
        `${API}/admissions/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to delete admission"
        );
      }

      setMessage("Admission deleted successfully");
      setMessageType("success");

      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to delete admission");
      setMessageType("error");
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // DISCHARGE
  // ==========================================

  const handleDischarge = async (admission) => {
    const confirmDischarge = window.confirm(
      `Discharge patient ${admission.patient_id}?`
    );

    if (!confirmDischarge) {
      return;
    }

    const today = new Date()
      .toISOString()
      .split("T")[0];

    try {
      setDischargingId(admission.id);

      const response = await fetch(
        `${API}/admissions/${admission.id}/discharge`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            discharge_date: today,
            discharge_time: new Date()
              .toTimeString()
              .slice(0, 5),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to discharge patient"
        );
      }

      setMessage("Patient discharged successfully");
      setMessageType("success");

      await loadData();
    } catch (error) {
      setMessage(
        error.message || "Failed to discharge patient"
      );
      setMessageType("error");
    } finally {
      setDischargingId(null);
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredAdmissions = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return admissions;
    }

    return admissions.filter((admission) => {
      return (
        String(admission.admission_id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(admission.patient_id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(admission.doctor_id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(admission.bed_id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(admission.diagnosis || "")
          .toLowerCase()
          .includes(searchText) ||
        String(admission.status || "")
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [admissions, search]);

  // ==========================================
  // COUNTS
  // ==========================================

  const totalAdmissions = admissions.length;

  const activeAdmissions = admissions.filter(
    (admission) => admission.status === "Admitted"
  ).length;

  const dischargedAdmissions = admissions.filter(
    (admission) => admission.status === "Discharged"
  ).length;

  const availableBeds = beds.filter(
    (bed) => bed.status === "Available"
  ).length;

  // ==========================================
  // PATIENT NAME
  // ==========================================

  const getPatientName = (patientId) => {
    const patient = patients.find(
      (item) => item.patient_id === patientId
    );

    return patient
      ? `${patient.name} (${patient.patient_id})`
      : patientId || "-";
  };

  // ==========================================
  // DOCTOR NAME
  // ==========================================

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(
      (item) => item.doctor_id === doctorId
    );

    return doctor
      ? `${doctor.name} (${doctor.doctor_id})`
      : doctorId || "-";
  };

  // ==========================================
  // STATUS BADGE
  // ==========================================

  const getStatusClass = (status) => {
    if (status === "Admitted") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Discharged") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Admission & Discharge
          </h1>

          <p className="text-gray-500 mt-1">
            Manage patient admissions, beds and discharge
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(initialForm);
            setMessage("");
            setMessageType("");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
        >
          + New Admission
        </button>

      </div>

      {/* ======================================
          MESSAGE
      ====================================== */}

      {message && (
        <div
          className={`p-4 rounded-lg font-medium ${
            messageType === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-sm text-gray-500">
            Total Admissions
          </p>

          <h2 className="text-3xl font-bold text-gray-800 mt-2">
            {totalAdmissions}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-sm text-gray-500">
            Currently Admitted
          </p>

          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {activeAdmissions}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-sm text-gray-500">
            Discharged
          </p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {dischargedAdmissions}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border">
          <p className="text-sm text-gray-500">
            Available Beds
          </p>

          <h2 className="text-3xl font-bold text-purple-600 mt-2">
            {availableBeds}
          </h2>
        </div>

      </div>

      {/* ======================================
          FORM
      ====================================== */}

      {showForm && (
        <div className="bg-white rounded-xl shadow border p-5 md:p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-bold text-gray-800">
              {editingId
                ? "Edit Admission"
                : "New Patient Admission"}
            </h2>

            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-800 text-xl"
            >
              ✕
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            {/* Admission ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admission ID *
              </label>

              <input
                type="text"
                name="admission_id"
                value={form.admission_id}
                onChange={handleChange}
                placeholder="ADM-001"
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient *
              </label>

              <select
                name="patient_id"
                value={form.patient_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  Select Patient
                </option>

                {patients.map((patient) => (
                  <option
                    key={patient.id}
                    value={patient.patient_id}
                  >
                    {patient.patient_id} - {patient.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor
              </label>

              <select
                name="doctor_id"
                value={form.doctor_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  Select Doctor
                </option>

                {doctors.map((doctor) => (
                  <option
                    key={doctor.id}
                    value={doctor.doctor_id}
                  >
                    {doctor.doctor_id} - {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bed
              </label>

              <select
                name="bed_id"
                value={form.bed_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  No Bed
                </option>

                {beds
                  .filter(
                    (bed) =>
                      bed.status === "Available" ||
                      bed.bed_id === form.bed_id
                  )
                  .map((bed) => (
                    <option
                      key={bed.id}
                      value={bed.bed_id}
                    >
                      {bed.bed_id} - {bed.ward} - Room{" "}
                      {bed.room_number} ({bed.bed_type})
                    </option>
                  ))}
              </select>
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admission Date *
              </label>

              <input
                type="date"
                name="admission_date"
                value={form.admission_date}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Admission Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admission Time
              </label>

              <input
                type="time"
                name="admission_time"
                value={form.admission_time}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis *
              </label>

              <input
                type="text"
                name="diagnosis"
                value={form.diagnosis}
                onChange={handleChange}
                placeholder="Enter diagnosis"
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={!editingId}
                className="w-full border rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="Admitted">
                  Admitted
                </option>

                <option value="Discharged">
                  Discharged
                </option>
              </select>
            </div>

            {/* Treatment Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment Notes
              </label>

              <textarea
                name="treatment_notes"
                value={form.treatment_notes}
                onChange={handleChange}
                rows="4"
                placeholder="Enter treatment notes..."
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">

              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Admission"
                  : "Admit Patient"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================
          SEARCH
      ====================================== */}

      <div className="bg-white rounded-xl shadow border p-4">

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search admission, patient, doctor, bed, diagnosis or status..."
          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      {/* ======================================
          TABLE
      ====================================== */}

      <div className="bg-white rounded-xl shadow border overflow-hidden">

        <div className="p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            Admission Records
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {filteredAdmissions.length} record(s) found
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading admissions...
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No admission records found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px]">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                    Admission
                  </th>

                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                    Patient
                  </th>

                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                    Doctor
                  </th>

                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                    Bed
                  </th>

                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                    Admission Date
                  </th>

                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                    Diagnosis
                  </th>

                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                {filteredAdmissions.map((admission) => (

                  <tr
                    key={admission.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-4 py-4">

                      <div className="font-semibold text-gray-800">
                        {admission.admission_id}
                      </div>

                      {admission.admission_time && (
                        <div className="text-xs text-gray-500 mt-1">
                          {admission.admission_time.slice(0, 5)}
                        </div>
                      )}

                    </td>

                    <td className="px-4 py-4">

                      <div className="font-medium text-gray-800">
                        {getPatientName(
                          admission.patient_id
                        )}
                      </div>

                    </td>

                    <td className="px-4 py-4 text-gray-700">

                      {getDoctorName(
                        admission.doctor_id
                      )}

                    </td>

                    <td className="px-4 py-4">

                      {admission.bed_id ? (
                        <span className="font-medium text-gray-700">
                          {admission.bed_id}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          No bed
                        </span>
                      )}

                    </td>

                    <td className="px-4 py-4 text-gray-700">

                      {admission.admission_date || "-"}

                    </td>

                    <td className="px-4 py-4">

                      <div className="max-w-[220px] truncate text-gray-700">
                        {admission.diagnosis || "-"}
                      </div>

                    </td>

                    <td className="px-4 py-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                          admission.status
                        )}`}
                      >
                        {admission.status}
                      </span>

                    </td>

                    <td className="px-4 py-4">

                      <div className="flex flex-wrap gap-2">

                        {admission.status !==
                          "Discharged" && (
                          <>
                            <button
                              onClick={() =>
                                handleEdit(admission)
                              }
                              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDischarge(
                                  admission
                                )
                              }
                              disabled={
                                dischargingId ===
                                admission.id
                              }
                              className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                              {dischargingId ===
                              admission.id
                                ? "..."
                                : "Discharge"}
                            </button>
                          </>
                        )}

                        <button
                          onClick={() =>
                            handleDelete(admission.id)
                          }
                          disabled={
                            deletingId === admission.id
                          }
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          {deletingId === admission.id
                            ? "..."
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

export default Admission;