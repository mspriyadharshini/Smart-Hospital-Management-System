import React, { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api/patients";
const API_BASE = "http://127.0.0.1:5000/api";

function Patients() {
  // =========================================
  // PATIENT DATA
  // =========================================

  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [editingId, setEditingId] = useState(null);

  // =========================================
  // SEARCH
  // =========================================

  const [search, setSearch] = useState("");

  // =========================================
  // MESSAGE
  // =========================================

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("success");

  // =========================================
  // PATIENT PROFILE
  // =========================================

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [profileLoading, setProfileLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    appointments: [],
    bills: [],
    beds: [],
  });

  // =========================================
  // FORM
  // =========================================

  const [formData, setFormData] = useState({
    patient_id: "",
    name: "",
    age: "",
    gender: "",
    phone: "",
    blood_group: "",
    disease: "",
    address: "",
  });

  // =========================================
  // SHOW MESSAGE
  // =========================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  // =========================================
  // FETCH PATIENTS
  // =========================================

  const fetchPatients = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      let data = [];

      try {
        data = await response.json();
      } catch {
        data = [];
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to load patients"
        );
      }

      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Patient fetch error:", error);

      showMessage(
        "❌ Patient data load ஆகவில்லை. Backend check பண்ணுங்க.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD PATIENTS
  // =========================================

  useEffect(() => {
    fetchPatients();
  }, []);

  // =========================================
  // HANDLE INPUT
  // =========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================
  // RESET FORM
  // =========================================

  const resetForm = () => {
    setFormData({
      patient_id: "",
      name: "",
      age: "",
      gender: "",
      phone: "",
      blood_group: "",
      disease: "",
      address: "",
    });

    setEditingId(null);
  };

  // =========================================
  // VALIDATION
  // =========================================

  const validateForm = () => {
    const patientId = formData.patient_id.trim();
    const name = formData.name.trim();
    const age = Number(formData.age);
    const phone = formData.phone.trim();

    if (!patientId) {
      showMessage(
        "❌ Patient ID is required",
        "error"
      );
      return false;
    }

    if (patientId.length < 2) {
      showMessage(
        "❌ Patient ID must contain at least 2 characters",
        "error"
      );
      return false;
    }

    if (!name) {
      showMessage(
        "❌ Patient name is required",
        "error"
      );
      return false;
    }

    if (name.length < 2) {
      showMessage(
        "❌ Patient name must contain at least 2 characters",
        "error"
      );
      return false;
    }

    if (!formData.age) {
      showMessage(
        "❌ Age is required",
        "error"
      );
      return false;
    }

    if (
      !Number.isInteger(age) ||
      age < 0 ||
      age > 120
    ) {
      showMessage(
        "❌ Age must be between 0 and 120",
        "error"
      );
      return false;
    }

    if (!formData.gender) {
      showMessage(
        "❌ Please select gender",
        "error"
      );
      return false;
    }

    if (!phone) {
      showMessage(
        "❌ Phone number is required",
        "error"
      );
      return false;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      showMessage(
        "❌ Phone number must contain exactly 10 digits",
        "error"
      );
      return false;
    }

    if (!formData.blood_group) {
      showMessage(
        "❌ Please select blood group",
        "error"
      );
      return false;
    }

    return true;
  };

  // =========================================
  // ADD / UPDATE PATIENT
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const patientData = {
        patient_id: formData.patient_id.trim(),
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        phone: formData.phone.trim(),
        blood_group: formData.blood_group,
        disease: formData.disease.trim(),
        address: formData.address.trim(),
      };

      let response;

      if (editingId) {
        response = await fetch(
          `${API_URL}/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(patientData),
          }
        );
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(patientData),
        });
      }

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        showMessage(
          `❌ ${
            data.error ||
            data.message ||
            "Failed to save patient"
          }`,
          "error"
        );
        return;
      }

      showMessage(
        editingId
          ? "✅ Patient updated successfully!"
          : "✅ Patient registered successfully!",
        "success"
      );

      resetForm();

      await fetchPatients();
    } catch (error) {
      console.error("Save patient error:", error);

      showMessage(
        "❌ Backend server connection failed",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // EDIT PATIENT
  // =========================================

  const handleEdit = (patient) => {
    setEditingId(patient.id);

    setFormData({
      patient_id: patient.patient_id || "",
      name: patient.name || "",
      age: patient.age || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      blood_group: patient.blood_group || "",
      disease: patient.disease || "",
      address: patient.address || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================
  // DELETE PATIENT
  // =========================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        showMessage(
          `❌ ${
            data.error ||
            data.message ||
            "Failed to delete patient"
          }`,
          "error"
        );
        return;
      }

      showMessage(
        "✅ Patient deleted successfully!",
        "success"
      );

      await fetchPatients();
    } catch (error) {
      console.error("Delete patient error:", error);

      showMessage(
        "❌ Backend server connection failed",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================
  // OPEN PATIENT 360 PROFILE
  // =========================================

  const openPatientProfile = async (patient) => {
    try {
      setSelectedPatient(patient);

      setProfileLoading(true);

      setProfileData({
        appointments: [],
        bills: [],
        beds: [],
      });

      const [
        appointmentsResponse,
        billsResponse,
        bedsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/appointments`),
        fetch(`${API_BASE}/bills`),
        fetch(`${API_BASE}/beds`),
      ]);

      let appointments = [];
      let bills = [];
      let beds = [];

      if (appointmentsResponse.ok) {
        appointments =
          await appointmentsResponse.json();
      }

      if (billsResponse.ok) {
        bills = await billsResponse.json();
      }

      if (bedsResponse.ok) {
        beds = await bedsResponse.json();
      }

      const patientId = String(
        patient.patient_id || ""
      );

      const patientAppointments =
        Array.isArray(appointments)
          ? appointments.filter(
              (item) =>
                String(
                  item.patient_id || ""
                ) === patientId
            )
          : [];

      const patientBills =
        Array.isArray(bills)
          ? bills.filter(
              (item) =>
                String(
                  item.patient_id || ""
                ) === patientId
            )
          : [];

      const patientBeds =
        Array.isArray(beds)
          ? beds.filter(
              (item) =>
                String(
                  item.patient_id || ""
                ) === patientId
            )
          : [];

      setProfileData({
        appointments: patientAppointments,
        bills: patientBills,
        beds: patientBeds,
      });
    } catch (error) {
      console.error(
        "Patient profile error:",
        error
      );

      showMessage(
        "❌ Patient profile data load ஆகவில்லை",
        "error"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // =========================================
  // CLOSE PROFILE
  // =========================================

  const closePatientProfile = () => {
    setSelectedPatient(null);

    setProfileData({
      appointments: [],
      bills: [],
      beds: [],
    });
  };

  // =========================================
  // SEARCH
  // =========================================

  const searchText = search.toLowerCase();

  const filteredPatients = patients.filter(
    (patient) => {
      return (
        String(
          patient.name || ""
        )
          .toLowerCase()
          .includes(searchText) ||
        String(
          patient.patient_id || ""
        )
          .toLowerCase()
          .includes(searchText) ||
        String(
          patient.phone || ""
        ).includes(search)
      );
    }
  );

  // =========================================
  // PROFILE TOTALS
  // =========================================

  const totalBill =
    profileData.bills.reduce(
      (total, bill) =>
        total +
        Number(
          bill.total_amount || 0
        ),
      0
    );

  const paidBill =
    profileData.bills
      .filter(
        (bill) =>
          String(
            bill.payment_status || ""
          ).toLowerCase() === "paid"
      )
      .reduce(
        (total, bill) =>
          total +
          Number(
            bill.total_amount || 0
          ),
        0
      );

  const pendingBill =
    totalBill - paidBill;

  // =========================================
  // PATIENT PROFILE VIEW
  // =========================================

  if (selectedPatient) {
    return (
      <PatientProfile
        patient={selectedPatient}
        profileData={profileData}
        loading={profileLoading}
        totalBill={totalBill}
        paidBill={paidBill}
        pendingBill={pendingBill}
        onBack={closePatientProfile}
      />
    );
  }

  // =========================================
  // MAIN PATIENT PAGE
  // =========================================

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-5 lg:p-8">

      <div className="max-w-7xl mx-auto">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="mb-6">

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Patient Management
          </h1>

          <p className="text-gray-500 mt-1">
            Register and manage hospital patients
          </p>

        </div>

        {/* =====================================
            MESSAGE
        ====================================== */}

        {message && (
          <div
            className={`mb-5 p-4 rounded-lg border ${
              messageType === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* =====================================
            REGISTER / EDIT FORM
        ====================================== */}

        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 lg:p-8 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

            <h2 className="text-xl font-bold text-gray-800">
              {editingId
                ? "✏️ Edit Patient"
                : "➕ Register New Patient"}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel Edit
              </button>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >

            {/* PATIENT ID */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Patient ID *
              </label>

              <input
                type="text"
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                placeholder="PAT-001"
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* NAME */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Patient Name *
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter patient name"
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* AGE */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age *
              </label>

              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="25"
                min="0"
                max="120"
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* GENDER */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender *
              </label>

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  Select Gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            {/* PHONE */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone *
              </label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength="10"
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* BLOOD GROUP */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Blood Group *
              </label>

              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  Select Blood Group
                </option>

                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            {/* DISEASE */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Disease
              </label>

              <input
                type="text"
                name="disease"
                value={formData.disease}
                onChange={handleChange}
                placeholder="Fever / Diabetes"
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* ADDRESS */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>

              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Salem"
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* BUTTON */}

            <div className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row justify-end gap-3">

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition ${
                  saving
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {saving
                  ? "⏳ Saving..."
                  : editingId
                  ? "💾 Update Patient"
                  : "➕ Register Patient"}
              </button>

            </div>

          </form>

        </div>

        {/* =====================================
            PATIENT LIST
        ====================================== */}

        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 lg:p-8">

          {/* LIST HEADER */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

            <div>

              <h2 className="text-xl font-bold text-gray-800">
                👥 Patient List
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Total Patients:{" "}
                {patients.length}
              </p>

            </div>

            {/* SEARCH */}

            <input
              type="text"
              placeholder="🔍 Search name / ID / phone"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="border border-gray-300 rounded-lg px-4 py-3 w-full lg:w-80 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* LOADING */}

          {loading ? (
            <div className="text-center py-10">

              <div className="text-4xl mb-3">
                ⏳
              </div>

              <p className="text-gray-500">
                Loading patients...
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead>

                  <tr className="bg-gray-50 border-b">

                    <th className="text-left p-4">
                      ID
                    </th>

                    <th className="text-left p-4">
                      Patient
                    </th>

                    <th className="text-left p-4">
                      Age
                    </th>

                    <th className="text-left p-4">
                      Gender
                    </th>

                    <th className="text-left p-4">
                      Phone
                    </th>

                    <th className="text-left p-4">
                      Blood
                    </th>

                    <th className="text-left p-4">
                      Disease
                    </th>

                    <th className="text-left p-4">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredPatients.length > 0 ? (
                    filteredPatients.map(
                      (patient) => (
                        <tr
                          key={patient.id}
                          className="border-b hover:bg-gray-50"
                        >

                          <td className="p-4 font-semibold text-blue-600">
                            {patient.patient_id}
                          </td>

                          <td className="p-4 font-medium text-gray-800">
                            {patient.name}
                          </td>

                          <td className="p-4">
                            {patient.age}
                          </td>

                          <td className="p-4">
                            {patient.gender}
                          </td>

                          <td className="p-4">
                            {patient.phone}
                          </td>

                          <td className="p-4">

                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                              {patient.blood_group ||
                                "-"}
                            </span>

                          </td>

                          <td className="p-4">
                            {patient.disease ||
                              "-"}
                          </td>

                          <td className="p-4">

                            <div className="flex flex-wrap gap-2">

                              {/* VIEW PROFILE */}

                              <button
                                onClick={() =>
                                  openPatientProfile(
                                    patient
                                  )
                                }
                                className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 text-sm font-semibold"
                              >
                                👁 Profile
                              </button>

                              {/* EDIT */}

                              <button
                                onClick={() =>
                                  handleEdit(
                                    patient
                                  )
                                }
                                className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg hover:bg-yellow-200 text-sm font-semibold"
                              >
                                ✏️ Edit
                              </button>

                              {/* DELETE */}

                              <button
                                onClick={() =>
                                  handleDelete(
                                    patient.id
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  patient.id
                                }
                                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                                  deletingId ===
                                  patient.id
                                    ? "bg-red-300 text-white cursor-not-allowed"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                }`}
                              >
                                {deletingId ===
                                patient.id
                                  ? "⏳"
                                  : "🗑️ Delete"}
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )
                  ) : (
                    <tr>

                      <td
                        colSpan="8"
                        className="text-center p-10 text-gray-500"
                      >
                        <div className="text-4xl mb-3">
                          📭
                        </div>

                        <p>
                          No patients found
                        </p>

                      </td>

                    </tr>
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

// ======================================================
// PATIENT 360° PROFILE
// ======================================================

function PatientProfile({
  patient,
  profileData,
  loading,
  totalBill,
  paidBill,
  pendingBill,
  onBack,
}) {
  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-5 lg:p-8">

      <div className="max-w-7xl mx-auto">

        {/* BACK */}

        <button
          onClick={onBack}
          className="mb-5 bg-gray-700 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-semibold"
        >
          ← Back to Patients
        </button>

        {/* PATIENT HEADER */}

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg p-5 sm:p-7 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div>

              <p className="text-blue-100 text-sm">
                Patient 360° Profile
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                {patient.name}
              </h1>

              <p className="text-blue-100 mt-2">
                Patient ID:{" "}
                <span className="font-bold text-white">
                  {patient.patient_id}
                </span>
              </p>

            </div>

            <div className="bg-white/10 rounded-xl px-5 py-4">

              <p className="text-blue-100 text-sm">
                Current Status
              </p>

              <p className="text-xl font-bold">
                {profileData.beds.length > 0
                  ? "🛏️ Admitted"
                  : "🏠 Out Patient"}
              </p>

            </div>

          </div>

        </div>

        {/* BASIC INFORMATION */}

        <div className="bg-white rounded-2xl shadow p-5 sm:p-6 mb-6">

          <h2 className="text-xl font-bold text-gray-800 mb-5">
            👤 Patient Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <InfoCard
              label="Patient ID"
              value={patient.patient_id}
            />

            <InfoCard
              label="Name"
              value={patient.name}
            />

            <InfoCard
              label="Age"
              value={patient.age}
            />

            <InfoCard
              label="Gender"
              value={patient.gender}
            />

            <InfoCard
              label="Phone"
              value={patient.phone}
            />

            <InfoCard
              label="Blood Group"
              value={patient.blood_group}
            />

            <InfoCard
              label="Disease"
              value={patient.disease}
            />

            <InfoCard
              label="Address"
              value={patient.address}
            />

          </div>

        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <SummaryCard
            title="Appointments"
            value={profileData.appointments.length}
            icon="📅"
          />

          <SummaryCard
            title="Total Bills"
            value={profileData.bills.length}
            icon="🧾"
          />

          <SummaryCard
            title="Total Bill"
            value={`₹${totalBill.toFixed(2)}`}
            icon="💰"
          />

          <SummaryCard
            title="Paid Amount"
            value={`₹${paidBill.toFixed(2)}`}
            icon="✅"
          />

        </div>

        {/* PENDING BILL */}

        {pendingBill > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 mb-6">

            <p className="font-semibold">
              ⚠️ Pending Payment
            </p>

            <p className="mt-1">
              Pending amount:{" "}
              <span className="font-bold">
                ₹{pendingBill.toFixed(2)}
              </span>
            </p>

          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">

            <div className="text-4xl mb-3">
              ⏳
            </div>

            <p className="text-gray-500 font-semibold">
              Loading patient history...
            </p>

          </div>
        ) : (
          <>
            {/* =====================================
                APPOINTMENTS
            ====================================== */}

            <div className="bg-white rounded-2xl shadow p-5 sm:p-6 mb-6">

              <div className="flex items-center justify-between mb-5">

                <h2 className="text-xl font-bold text-gray-800">
                  📅 Appointment History
                </h2>

                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {profileData.appointments.length}
                </span>

              </div>

              {profileData.appointments.length === 0 ? (
                <EmptyState text="No appointments found for this patient." />
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[700px]">

                    <thead>

                      <tr className="bg-gray-50 border-b">

                        <th className="text-left p-3">
                          Appointment
                        </th>

                        <th className="text-left p-3">
                          Doctor
                        </th>

                        <th className="text-left p-3">
                          Date
                        </th>

                        <th className="text-left p-3">
                          Time
                        </th>

                        <th className="text-left p-3">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {profileData.appointments.map(
                        (appointment) => (
                          <tr
                            key={appointment.id}
                            className="border-b hover:bg-gray-50"
                          >

                            <td className="p-3 font-semibold">
                              {appointment.appointment_id ||
                                appointment.id}
                            </td>

                            <td className="p-3">
                              {appointment.doctor_id ||
                                "-"}
                            </td>

                            <td className="p-3">
                              {appointment.appointment_date ||
                                "-"}
                            </td>

                            <td className="p-3">
                              {appointment.appointment_time ||
                                "-"}
                            </td>

                            <td className="p-3">

                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                {appointment.status ||
                                  "Scheduled"}
                              </span>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

            {/* =====================================
                BILLING
            ====================================== */}

            <div className="bg-white rounded-2xl shadow p-5 sm:p-6 mb-6">

              <div className="flex items-center justify-between mb-5">

                <h2 className="text-xl font-bold text-gray-800">
                  🧾 Billing History
                </h2>

                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {profileData.bills.length}
                </span>

              </div>

              {profileData.bills.length === 0 ? (
                <EmptyState text="No bills found for this patient." />
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[650px]">

                    <thead>

                      <tr className="bg-gray-50 border-b">

                        <th className="text-left p-3">
                          Bill ID
                        </th>

                        <th className="text-left p-3">
                          Date
                        </th>

                        <th className="text-left p-3">
                          Amount
                        </th>

                        <th className="text-left p-3">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {profileData.bills.map(
                        (bill) => {
                          const isPaid =
                            String(
                              bill.payment_status ||
                                ""
                            ).toLowerCase() ===
                            "paid";

                          return (
                            <tr
                              key={bill.id}
                              className="border-b hover:bg-gray-50"
                            >

                              <td className="p-3 font-semibold">
                                {bill.bill_id}
                              </td>

                              <td className="p-3">
                                {bill.bill_date ||
                                  "-"}
                              </td>

                              <td className="p-3 font-semibold">
                                ₹
                                {Number(
                                  bill.total_amount ||
                                    0
                                ).toFixed(2)}
                              </td>

                              <td className="p-3">

                                <span
                                  className={`px-3 py-1 rounded-full text-sm ${
                                    isPaid
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {bill.payment_status ||
                                    "Pending"}
                                </span>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

            {/* =====================================
                BED / ADMISSION
            ====================================== */}

            <div className="bg-white rounded-2xl shadow p-5 sm:p-6 mb-6">

              <h2 className="text-xl font-bold text-gray-800 mb-5">
                🛏️ Bed / Admission Details
              </h2>

              {profileData.beds.length === 0 ? (
                <EmptyState text="Patient is not currently assigned to a bed." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {profileData.beds.map(
                    (bed) => (
                      <div
                        key={bed.id}
                        className="border border-green-200 bg-green-50 rounded-xl p-5"
                      >

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-sm text-gray-500">
                              Bed ID
                            </p>

                            <p className="text-2xl font-bold text-gray-800">
                              {bed.bed_id}
                            </p>

                          </div>

                          <div className="text-3xl">
                            🛏️
                          </div>

                        </div>

                        <div className="mt-5 space-y-2 text-gray-700">

                          <p>
                            <span className="font-semibold">
                              Ward:
                            </span>{" "}
                            {bed.ward || "-"}
                          </p>

                          <p>
                            <span className="font-semibold">
                              Room:
                            </span>{" "}
                            {bed.room_number || "-"}
                          </p>

                          <p>
                            <span className="font-semibold">
                              Type:
                            </span>{" "}
                            {bed.bed_type || "-"}
                          </p>

                          <p>
                            <span className="font-semibold">
                              Status:
                            </span>{" "}
                            {bed.status || "-"}
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </>
        )}

      </div>

    </div>
  );
}

// ======================================================
// INFO CARD
// ======================================================

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="font-semibold text-gray-800 mt-1 break-words">
        {value || "-"}
      </p>

    </div>
  );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5">

      <div className="flex justify-between items-center gap-4">

        <div>

          <p className="text-gray-500">
            {title}
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-2">
            {value}
          </p>

        </div>

        <div className="text-3xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

// ======================================================
// EMPTY STATE
// ======================================================

function EmptyState({ text }) {
  return (
    <div className="text-center py-8 text-gray-500">

      <div className="text-3xl mb-2">
        📭
      </div>

      <p>
        {text}
      </p>

    </div>
  );
}

export default Patients;