import React, { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api/beds";

function Beds() {
  const [beds, setBeds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [form, setForm] = useState({
    bed_id: "",
    ward: "",
    room_number: "",
    bed_type: "General",
    patient_id: "",
    status: "Available",
  });

  // =========================
  // SHOW MESSAGE
  // =========================
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  // =========================
  // SAFE JSON
  // =========================
  const getResponseData = async (response) => {
    try {
      return await response.json();
    } catch {
      return {};
    }
  };

  // =========================
  // FETCH BEDS
  // =========================
  const fetchBeds = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);
      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to load beds");
      }

      setBeds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);

      showMessage(
        error.message || "Backend server is not running",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  // =========================
  // INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // VALIDATION
  // =========================
  const validateForm = () => {
    const bedId = form.bed_id.trim();
    const ward = form.ward.trim();
    const roomNumber = form.room_number.trim();

    if (!bedId) {
      showMessage("Bed ID is required.", "error");
      return false;
    }

    if (bedId.length < 2) {
      showMessage("Bed ID must contain at least 2 characters.", "error");
      return false;
    }

    if (!ward) {
      showMessage("Ward is required.", "error");
      return false;
    }

    if (ward.length < 2) {
      showMessage("Ward name must contain at least 2 characters.", "error");
      return false;
    }

    if (!roomNumber) {
      showMessage("Room Number is required.", "error");
      return false;
    }

    if (!form.bed_type) {
      showMessage("Please select a bed type.", "error");
      return false;
    }

    if (!form.status) {
      showMessage("Please select a bed status.", "error");
      return false;
    }

    const validBedTypes = [
      "General",
      "ICU",
      "Private",
      "Semi Private",
      "Emergency",
    ];

    if (!validBedTypes.includes(form.bed_type)) {
      showMessage("Invalid bed type selected.", "error");
      return false;
    }

    const validStatuses = [
      "Available",
      "Occupied",
      "Maintenance",
    ];

    if (!validStatuses.includes(form.status)) {
      showMessage("Invalid bed status selected.", "error");
      return false;
    }

    // If bed is Available, patient should not normally be assigned
    if (form.status === "Available" && form.patient_id.trim()) {
      showMessage(
        "Available bed should not have a Patient ID.",
        "error"
      );
      return false;
    }

    // If occupied, patient ID is required
    if (form.status === "Occupied" && !form.patient_id.trim()) {
      showMessage(
        "Patient ID is required when the bed is Occupied.",
        "error"
      );
      return false;
    }

    return true;
  };

  // =========================
  // ADD / UPDATE BED
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const bedData = {
      bed_id: form.bed_id.trim(),
      ward: form.ward.trim(),
      room_number: form.room_number.trim(),
      bed_type: form.bed_type,
      patient_id: form.patient_id.trim() || null,
      status: form.status,
    };

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bedData),
      });

      const data = await getResponseData(response);

      if (!response.ok) {
        showMessage(
          data.error ||
            data.message ||
            "Something went wrong",
          "error"
        );
        return;
      }

      showMessage(
        editingId
          ? "Bed updated successfully!"
          : "Bed added successfully!",
        "success"
      );

      resetForm();

      await fetchBeds();
    } catch (error) {
      console.error(error);

      showMessage(
        "Backend server connection failed!",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT
  // =========================
  const handleEdit = (bed) => {
    setEditingId(bed.id);

    setForm({
      bed_id: bed.bed_id || "",
      ward: bed.ward || "",
      room_number: bed.room_number || "",
      bed_type: bed.bed_type || "General",
      patient_id: bed.patient_id || "",
      status: bed.status || "Available",
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this bed?"
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

      const data = await getResponseData(response);

      if (!response.ok) {
        showMessage(
          data.error ||
            data.message ||
            "Delete failed",
          "error"
        );
        return;
      }

      showMessage(
        "Bed deleted successfully!",
        "success"
      );

      if (editingId === id) {
        resetForm();
      }

      await fetchBeds();
    } catch (error) {
      console.error(error);

      showMessage(
        "Backend server connection failed!",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // RESET
  // =========================
  const resetForm = () => {
    setEditingId(null);

    setForm({
      bed_id: "",
      ward: "",
      room_number: "",
      bed_type: "General",
      patient_id: "",
      status: "Available",
    });
  };

  // =========================
  // SEARCH
  // =========================
  const filteredBeds = beds.filter((bed) => {
    const text = `
      ${bed.bed_id || ""}
      ${bed.ward || ""}
      ${bed.room_number || ""}
      ${bed.bed_type || ""}
      ${bed.patient_id || ""}
      ${bed.status || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase().trim());
  });

  // =========================
  // COUNTS
  // =========================
  const totalBeds = beds.length;

  const availableBeds = beds.filter(
    (bed) => bed.status === "Available"
  ).length;

  const occupiedBeds = beds.filter(
    (bed) => bed.status === "Occupied"
  ).length;

  const maintenanceBeds = beds.filter(
    (bed) => bed.status === "Maintenance"
  ).length;

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Bed Management
        </h1>

        <p className="text-slate-500 mt-1">
          Manage hospital beds and room allocation
        </p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 border font-medium ${
            messageType === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-slate-500">
            Total Beds
          </p>

          <h2 className="text-3xl font-bold mt-2 text-slate-800">
            {totalBeds}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-slate-500">
            Available
          </p>

          <h2 className="text-3xl font-bold mt-2 text-green-600">
            {availableBeds}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-slate-500">
            Occupied
          </p>

          <h2 className="text-3xl font-bold mt-2 text-red-600">
            {occupiedBeds}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-slate-500">
            Maintenance
          </p>

          <h2 className="text-3xl font-bold mt-2 text-yellow-600">
            {maintenanceBeds}
          </h2>
        </div>

      </div>

      {/* ADD / EDIT FORM */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

          <h2 className="text-xl font-bold text-slate-800">
            {editingId ? "Edit Bed" : "Add New Bed"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 disabled:opacity-50"
            >
              Cancel Edit
            </button>
          )}

        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >

          {/* BED ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bed ID *
            </label>

            <input
              type="text"
              name="bed_id"
              value={form.bed_id}
              onChange={handleChange}
              placeholder="BED-001"
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* WARD */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ward *
            </label>

            <input
              type="text"
              name="ward"
              value={form.ward}
              onChange={handleChange}
              placeholder="General Ward"
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* ROOM */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Room Number *
            </label>

            <input
              type="text"
              name="room_number"
              value={form.room_number}
              onChange={handleChange}
              placeholder="101"
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* BED TYPE */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bed Type
            </label>

            <select
              name="bed_type"
              value={form.bed_type}
              onChange={handleChange}
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="General">General</option>
              <option value="ICU">ICU</option>
              <option value="Private">Private</option>
              <option value="Semi Private">Semi Private</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* PATIENT ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Patient ID
            </label>

            <input
              type="text"
              name="patient_id"
              value={form.patient_id}
              onChange={handleChange}
              placeholder="PAT-001"
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* STATUS */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          {/* BUTTONS */}
          <div className="md:col-span-3 flex flex-wrap gap-3 mt-2">

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                ? "Update Bed"
                : "Add Bed"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="bg-slate-500 text-white px-6 py-2.5 rounded-lg hover:bg-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
            )}

          </div>

        </form>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">

        <input
          type="text"
          placeholder="Search bed, ward, room, patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      {/* BED TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        <div className="p-5 border-b border-slate-200">

          <h2 className="text-xl font-bold text-slate-800">
            Bed Inventory
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {filteredBeds.length} bed(s)
          </p>

        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">
            Loading beds...
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-100">

                <tr>

                  <th className="px-4 py-3 text-left text-sm">
                    Bed ID
                  </th>

                  <th className="px-4 py-3 text-left text-sm">
                    Ward
                  </th>

                  <th className="px-4 py-3 text-left text-sm">
                    Room
                  </th>

                  <th className="px-4 py-3 text-left text-sm">
                    Type
                  </th>

                  <th className="px-4 py-3 text-left text-sm">
                    Patient
                  </th>

                  <th className="px-4 py-3 text-left text-sm">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-sm">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredBeds.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="text-center py-10 text-slate-500"
                    >
                      No beds found
                    </td>

                  </tr>

                ) : (

                  filteredBeds.map((bed) => (

                    <tr
                      key={bed.id}
                      className="border-t hover:bg-slate-50"
                    >

                      <td className="px-4 py-3 font-semibold">
                        {bed.bed_id}
                      </td>

                      <td className="px-4 py-3">
                        {bed.ward}
                      </td>

                      <td className="px-4 py-3">
                        {bed.room_number}
                      </td>

                      <td className="px-4 py-3">
                        {bed.bed_type}
                      </td>

                      <td className="px-4 py-3">
                        {bed.patient_id || "-"}
                      </td>

                      <td className="px-4 py-3">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            bed.status === "Available"
                              ? "bg-green-100 text-green-700"
                              : bed.status === "Occupied"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {bed.status}
                        </span>

                      </td>

                      <td className="px-4 py-3">

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() => handleEdit(bed)}
                            disabled={
                              saving ||
                              deletingId === bed.id
                            }
                            className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(bed.id)}
                            disabled={
                              saving ||
                              deletingId === bed.id
                            }
                            className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50"
                          >
                            {deletingId === bed.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Beds;