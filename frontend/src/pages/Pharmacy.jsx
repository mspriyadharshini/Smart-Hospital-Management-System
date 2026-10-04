import React, { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api/medicines";

function Pharmacy() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [form, setForm] = useState({
    medicine_id: "",
    medicine_name: "",
    category: "",
    quantity: "",
    price: "",
    expiry_date: "",
    supplier: "",
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
  // FETCH MEDICINES
  // =========================
  const fetchMedicines = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);
      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch medicines");
      }

      setMedicines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showMessage(
        error.message || "Pharmacy server connection failed!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // =========================
  // HANDLE INPUT
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // RESET FORM
  // =========================
  const resetForm = () => {
    setForm({
      medicine_id: "",
      medicine_name: "",
      category: "",
      quantity: "",
      price: "",
      expiry_date: "",
      supplier: "",
      status: "Available",
    });

    setEditingId(null);
  };

  // =========================
  // VALIDATION
  // =========================
  const validateForm = () => {
    const medicineId = form.medicine_id.trim();
    const medicineName = form.medicine_name.trim();

    if (!medicineId) {
      showMessage("Medicine ID is required.", "error");
      return false;
    }

    if (!medicineName) {
      showMessage("Medicine Name is required.", "error");
      return false;
    }

    if (medicineName.length < 2) {
      showMessage("Medicine Name must contain at least 2 characters.", "error");
      return false;
    }

    if (form.quantity === "") {
      showMessage("Quantity is required.", "error");
      return false;
    }

    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity < 0) {
      showMessage("Quantity must be a valid whole number.", "error");
      return false;
    }

    if (form.price === "") {
      showMessage("Price is required.", "error");
      return false;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price < 0) {
      showMessage("Price must be a valid positive number.", "error");
      return false;
    }

    if (form.expiry_date) {
      const expiryDate = new Date(form.expiry_date);

      if (Number.isNaN(expiryDate.getTime())) {
        showMessage("Please select a valid expiry date.", "error");
        return false;
      }
    }

    if (!["Available", "Out of Stock", "Expired"].includes(form.status)) {
      showMessage("Please select a valid medicine status.", "error");
      return false;
    }

    return true;
  };

  // =========================
  // SAVE MEDICINE
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const medicineData = {
      medicine_id: form.medicine_id.trim(),
      medicine_name: form.medicine_name.trim(),
      category: form.category.trim(),
      quantity: Number(form.quantity),
      price: Number(form.price),
      expiry_date: form.expiry_date || null,
      supplier: form.supplier.trim(),
      status: form.status,
    };

    try {
      setSaving(true);

      let response;

      if (editingId) {
        response = await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(medicineData),
        });
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(medicineData),
        });
      }

      const data = await getResponseData(response);

      if (!response.ok) {
        showMessage(
          data.error || data.message || "Failed to save medicine.",
          "error"
        );
        return;
      }

      showMessage(
        editingId
          ? "Medicine updated successfully!"
          : "Medicine added successfully!",
        "success"
      );

      resetForm();
      await fetchMedicines();
    } catch (error) {
      console.error(error);
      showMessage("Pharmacy server connection failed!", "error");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT MEDICINE
  // =========================
  const handleEdit = (medicine) => {
    setEditingId(medicine.id);

    setForm({
      medicine_id: medicine.medicine_id || "",
      medicine_name: medicine.medicine_name || "",
      category: medicine.category || "",
      quantity: medicine.quantity ?? "",
      price: medicine.price ?? "",
      expiry_date: medicine.expiry_date || "",
      supplier: medicine.supplier || "",
      status: medicine.status || "Available",
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // DELETE MEDICINE
  // =========================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this medicine?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await getResponseData(response);

      if (!response.ok) {
        showMessage(
          data.error || data.message || "Failed to delete medicine.",
          "error"
        );
        return;
      }

      showMessage("Medicine deleted successfully!", "success");

      if (editingId === id) {
        resetForm();
      }

      await fetchMedicines();
    } catch (error) {
      console.error(error);
      showMessage("Pharmacy server connection failed!", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // SEARCH
  // =========================
  const filteredMedicines = medicines.filter((medicine) => {
    const text = search.toLowerCase().trim();

    return (
      String(medicine.medicine_id || "")
        .toLowerCase()
        .includes(text) ||
      String(medicine.medicine_name || "")
        .toLowerCase()
        .includes(text) ||
      String(medicine.category || "")
        .toLowerCase()
        .includes(text) ||
      String(medicine.supplier || "")
        .toLowerCase()
        .includes(text)
    );
  });

  // =========================
  // LOW STOCK COUNT
  // =========================
  const lowStockCount = medicines.filter(
    (medicine) => Number(medicine.quantity) <= 10
  ).length;

  // =========================
  // AVAILABLE COUNT
  // =========================
  const availableCount = medicines.filter(
    (medicine) => medicine.status === "Available"
  ).length;

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Pharmacy Management
        </h1>

        <p className="text-slate-500 mt-1">
          Manage medicines, stock and suppliers
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Medicines
          </p>

          <p className="text-3xl font-bold text-blue-600 mt-2">
            {medicines.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Low Stock
          </p>

          <p className="text-3xl font-bold text-orange-500 mt-2">
            {lowStockCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Available
          </p>

          <p className="text-3xl font-bold text-green-600 mt-2">
            {availableCount}
          </p>
        </div>

      </div>

      {/* ADD / EDIT FORM */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

          <h2 className="text-xl font-semibold text-slate-800">
            {editingId ? "Edit Medicine" : "Add Medicine"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg disabled:opacity-50"
            >
              Cancel Edit
            </button>
          )}

        </div>

        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* MEDICINE ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Medicine ID *
              </label>

              <input
                type="text"
                name="medicine_id"
                value={form.medicine_id}
                onChange={handleChange}
                placeholder="MED001"
                disabled={saving}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            {/* MEDICINE NAME */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Medicine Name *
              </label>

              <input
                type="text"
                name="medicine_name"
                value={form.medicine_name}
                onChange={handleChange}
                placeholder="Paracetamol"
                disabled={saving}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>

              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Tablet / Syrup / Injection"
                disabled={saving}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            {/* QUANTITY */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantity *
              </label>

              <input
                type="number"
                min="0"
                step="1"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="100"
                disabled={saving}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            {/* PRICE */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price *
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="10.00"
                disabled={saving}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            {/* EXPIRY */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expiry Date
              </label>

              <input
                type="date"
                name="expiry_date"
                value={form.expiry_date}
                onChange={handleChange}
                disabled={saving}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            {/* SUPPLIER */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Supplier
              </label>

              <input
                type="text"
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                placeholder="ABC Pharma"
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
                <option value="Out of Stock">Out of Stock</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

          </div>

          {/* BUTTON */}
          <div className="mt-6 flex justify-end">

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                ? "Update Medicine"
                : "Add Medicine"}
            </button>

          </div>

        </form>
      </div>

      {/* MEDICINE LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Medicine Inventory
            </h2>

            <p className="text-sm text-slate-500">
              {filteredMedicines.length} medicine(s)
            </p>
          </div>

          <input
            type="text"
            placeholder="Search medicine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">
            Loading medicines...
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No medicines found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>
                <tr className="bg-slate-100 text-left">

                  <th className="px-4 py-3 text-sm font-semibold">
                    Medicine ID
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Name
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Category
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Quantity
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Price
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Expiry
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredMedicines.map((medicine) => (

                  <tr
                    key={medicine.id}
                    className="border-b hover:bg-slate-50"
                  >

                    <td className="px-4 py-3 font-medium">
                      {medicine.medicine_id}
                    </td>

                    <td className="px-4 py-3">
                      {medicine.medicine_name}
                    </td>

                    <td className="px-4 py-3">
                      {medicine.category || "-"}
                    </td>

                    <td className="px-4 py-3">

                      <span
                        className={
                          Number(medicine.quantity) <= 10
                            ? "text-orange-600 font-bold"
                            : "text-slate-700"
                        }
                      >
                        {medicine.quantity}
                      </span>

                    </td>

                    <td className="px-4 py-3">
                      ₹{Number(medicine.price || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      {medicine.expiry_date || "-"}
                    </td>

                    <td className="px-4 py-3">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          medicine.status === "Available"
                            ? "bg-green-100 text-green-700"
                            : medicine.status === "Expired"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {medicine.status}
                      </span>

                    </td>

                    <td className="px-4 py-3">

                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() => handleEdit(medicine)}
                          disabled={saving || deletingId === medicine.id}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(medicine.id)}
                          disabled={saving || deletingId === medicine.id}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                        >
                          {deletingId === medicine.id
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

export default Pharmacy;