import React, { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:5000/api";

const emptyForm = {
  bill_id: "",
  patient_id: "",
  bill_date: new Date().toISOString().split("T")[0],
  consultation_fee: "",
  medicine_fee: "",
  lab_fee: "",
  room_fee: "",
  other_charges: "",
  payment_status: "Pending",
};

function Billing() {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // -----------------------------
  // LOAD BILLS + PATIENTS
  // -----------------------------

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [billResponse, patientResponse] = await Promise.all([
        fetch(`${API}/bills`),
        fetch(`${API}/patients`),
      ]);

      const billData = await billResponse.json();
      const patientData = await patientResponse.json();

      if (!billResponse.ok) {
        throw new Error(
          billData.error || "Failed to load bills."
        );
      }

      if (!patientResponse.ok) {
        throw new Error(
          patientData.error || "Failed to load patients."
        );
      }

      setBills(
        Array.isArray(billData)
          ? billData
          : billData.bills || []
      );

      setPatients(
        Array.isArray(patientData)
          ? patientData
          : patientData.patients || []
      );
    } catch (err) {
      setError(err.message || "Failed to load billing data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -----------------------------
  // CLEAR MESSAGE
  // -----------------------------

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // -----------------------------
  // INPUT CHANGE
  // -----------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearMessages();
  };

  // -----------------------------
  // NUMBER HELPER
  // -----------------------------

  const numberValue = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      return 0;
    }

    return number;
  };

  // -----------------------------
  // LIVE TOTAL
  // -----------------------------

  const liveTotal = useMemo(() => {
    return (
      numberValue(form.consultation_fee) +
      numberValue(form.medicine_fee) +
      numberValue(form.lab_fee) +
      numberValue(form.room_fee) +
      numberValue(form.other_charges)
    );
  }, [
    form.consultation_fee,
    form.medicine_fee,
    form.lab_fee,
    form.room_fee,
    form.other_charges,
  ]);

  // -----------------------------
  // VALIDATION
  // -----------------------------

  const validateForm = () => {
    if (!form.bill_id.trim()) {
      return "Bill ID is required.";
    }

    if (form.bill_id.trim().length < 2) {
      return "Bill ID must contain at least 2 characters.";
    }

    if (!form.patient_id) {
      return "Please select a patient.";
    }

    if (!form.bill_date) {
      return "Please select bill date.";
    }

    const fees = [
      ["Consultation fee", form.consultation_fee],
      ["Medicine fee", form.medicine_fee],
      ["Lab fee", form.lab_fee],
      ["Room fee", form.room_fee],
      ["Other charges", form.other_charges],
    ];

    for (const [label, value] of fees) {
      if (value !== "" && Number(value) < 0) {
        return `${label} cannot be negative.`;
      }

      if (
        value !== "" &&
        !Number.isFinite(Number(value))
      ) {
        return `${label} must be a valid number.`;
      }
    }

    if (
      ![
        "Pending",
        "Paid",
        "Partially Paid",
        "Cancelled",
      ].includes(form.payment_status)
    ) {
      return "Invalid payment status.";
    }

    const duplicate = bills.find((bill) => {
      if (editingId && bill.id === editingId) {
        return false;
      }

      return (
        String(bill.bill_id).toLowerCase() ===
        form.bill_id.trim().toLowerCase()
      );
    });

    if (duplicate) {
      return "This Bill ID already exists.";
    }

    return "";
  };

  // -----------------------------
  // ADD / UPDATE BILL
  // -----------------------------

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
        ? `${API}/bills/${editingId}`
        : `${API}/bills`;

      const method = editingId ? "PUT" : "POST";

      const payload = {
        bill_id: form.bill_id.trim(),
        patient_id: form.patient_id,
        bill_date: form.bill_date,
        consultation_fee: numberValue(
          form.consultation_fee
        ),
        medicine_fee: numberValue(form.medicine_fee),
        lab_fee: numberValue(form.lab_fee),
        room_fee: numberValue(form.room_fee),
        other_charges: numberValue(
          form.other_charges
        ),
        total_amount: liveTotal,
        payment_status: form.payment_status,
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
            "Failed to save bill."
        );
      }

      setSuccess(
        editingId
          ? "Bill updated successfully."
          : "Bill created successfully."
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to save bill.");
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // EDIT BILL
  // -----------------------------

  const handleEdit = (bill) => {
    clearMessages();

    setEditingId(bill.id);

    setForm({
      bill_id: bill.bill_id || "",
      patient_id: bill.patient_id || "",
      bill_date: bill.bill_date
        ? String(bill.bill_date).slice(0, 10)
        : "",
      consultation_fee:
        bill.consultation_fee ?? "",
      medicine_fee:
        bill.medicine_fee ?? "",
      lab_fee: bill.lab_fee ?? "",
      room_fee: bill.room_fee ?? "",
      other_charges:
        bill.other_charges ?? "",
      payment_status:
        bill.payment_status || "Pending",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -----------------------------
  // CANCEL EDIT
  // -----------------------------

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    clearMessages();
  };

  // -----------------------------
  // DELETE BILL
  // -----------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this bill?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      clearMessages();

      const response = await fetch(
        `${API}/bills/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to delete bill."
        );
      }

      setSuccess("Bill deleted successfully.");

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete bill.");
    } finally {
      setDeletingId(null);
    }
  };

  // -----------------------------
  // PAYMENT STATUS UPDATE
  // -----------------------------

  const handlePaymentStatus = async (
    bill,
    newStatus
  ) => {
    try {
      clearMessages();

      const response = await fetch(
        `${API}/bills/${bill.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bill_id: bill.bill_id,
            patient_id: bill.patient_id,
            bill_date: String(
              bill.bill_date
            ).slice(0, 10),
            consultation_fee:
              numberValue(
                bill.consultation_fee
              ),
            medicine_fee:
              numberValue(
                bill.medicine_fee
              ),
            lab_fee:
              numberValue(bill.lab_fee),
            room_fee:
              numberValue(bill.room_fee),
            other_charges:
              numberValue(
                bill.other_charges
              ),
            total_amount:
              numberValue(
                bill.total_amount
              ),
            payment_status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to update payment status."
        );
      }

      setSuccess(
        `Bill ${bill.bill_id} marked as ${newStatus}.`
      );

      await loadData();
    } catch (err) {
      setError(
        err.message ||
          "Failed to update payment status."
      );
    }
  };

  // -----------------------------
  // PRINT BILL
  // -----------------------------

  const handlePrint = (bill) => {
    const patient = patients.find(
      (p) =>
        String(p.patient_id) ===
        String(bill.patient_id)
    );

    const patientName =
      patient?.name || bill.patient_id || "-";

    const printWindow = window.open(
      "",
      "_blank",
      "width=800,height=900"
    );

    if (!printWindow) {
      setError(
        "Please allow pop-ups in your browser to print the invoice."
      );
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Hospital Invoice - ${bill.bill_id}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #222;
            }

            .header {
              text-align: center;
              margin-bottom: 30px;
            }

            .header h1 {
              margin: 0;
              color: #2563eb;
            }

            .header p {
              margin: 5px 0;
              color: #666;
            }

            .details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th,
            td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }

            th {
              background: #f3f4f6;
            }

            .total {
              text-align: right;
              font-size: 20px;
              font-weight: bold;
              margin-top: 20px;
            }

            .status {
              margin-top: 15px;
              font-weight: bold;
            }

            .footer {
              margin-top: 60px;
              text-align: center;
              color: #777;
              font-size: 12px;
            }
          </style>
        </head>

        <body>

          <div class="header">
            <h1>Smart Hospital</h1>
            <p>Hospital Management System</p>
            <p>Patient Billing Invoice</p>
          </div>

          <div class="details">

            <div>
              <strong>Bill ID:</strong>
              ${bill.bill_id}
              <br />

              <strong>Bill Date:</strong>
              ${String(
                bill.bill_date || "-"
              ).slice(0, 10)}
            </div>

            <div>
              <strong>Patient:</strong>
              ${patientName}
              <br />

              <strong>Patient ID:</strong>
              ${bill.patient_id || "-"}
            </div>

          </div>

          <table>

            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>

              <tr>
                <td>Consultation Fee</td>
                <td>₹${numberValue(
                  bill.consultation_fee
                ).toFixed(2)}</td>
              </tr>

              <tr>
                <td>Medicine Fee</td>
                <td>₹${numberValue(
                  bill.medicine_fee
                ).toFixed(2)}</td>
              </tr>

              <tr>
                <td>Lab Fee</td>
                <td>₹${numberValue(
                  bill.lab_fee
                ).toFixed(2)}</td>
              </tr>

              <tr>
                <td>Room Fee</td>
                <td>₹${numberValue(
                  bill.room_fee
                ).toFixed(2)}</td>
              </tr>

              <tr>
                <td>Other Charges</td>
                <td>₹${numberValue(
                  bill.other_charges
                ).toFixed(2)}</td>
              </tr>

            </tbody>

          </table>

          <div class="total">
            Total Amount:
            ₹${numberValue(
              bill.total_amount
            ).toFixed(2)}
          </div>

          <div class="status">
            Payment Status:
            ${bill.payment_status || "Pending"}
          </div>

          <div class="footer">
            Smart Hospital Management System
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>

        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // -----------------------------
  // SEARCH
  // -----------------------------

  const filteredBills = bills.filter((bill) => {
    const searchText = search.toLowerCase();

    return (
      String(
        bill.bill_id || ""
      )
        .toLowerCase()
        .includes(searchText) ||
      String(
        bill.patient_id || ""
      )
        .toLowerCase()
        .includes(searchText) ||
      String(
        bill.payment_status || ""
      )
        .toLowerCase()
        .includes(searchText)
    );
  });

  // -----------------------------
  // SUMMARY
  // -----------------------------

  const totalRevenue = bills.reduce(
    (sum, bill) =>
      sum + numberValue(bill.total_amount),
    0
  );

  const paidRevenue = bills
    .filter(
      (bill) =>
        bill.payment_status === "Paid"
    )
    .reduce(
      (sum, bill) =>
        sum +
        numberValue(bill.total_amount),
      0
    );

  const pendingRevenue = bills
    .filter(
      (bill) =>
        bill.payment_status !== "Paid" &&
        bill.payment_status !== "Cancelled"
    )
    .reduce(
      (sum, bill) =>
        sum +
        numberValue(bill.total_amount),
      0
    );

  const paidBills = bills.filter(
    (bill) =>
      bill.payment_status === "Paid"
  ).length;

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Billing Management
        </h1>

        <p className="text-gray-500 mt-1">
          Create bills, manage payments and print patient invoices.
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

      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-sm">
            Total Bills
          </p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {bills.length}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-sm">
            Total Billing
          </p>

          <h2 className="text-3xl font-bold text-purple-600 mt-2">
            ₹{totalRevenue.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-sm">
            Paid Revenue
          </p>

          <h2 className="text-3xl font-bold text-green-600 mt-2">
            ₹{paidRevenue.toFixed(2)}
          </h2>

          <p className="text-xs text-gray-400 mt-1">
            {paidBills} paid bills
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-500 text-sm">
            Pending Amount
          </p>

          <h2 className="text-3xl font-bold text-orange-600 mt-2">
            ₹{pendingRevenue.toFixed(2)}
          </h2>
        </div>

      </div>

      {/* FORM */}

      <div className="bg-white rounded-xl shadow p-5 md:p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {editingId
                ? "Edit Bill"
                : "Create New Bill"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Enter patient billing details.
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

          {/* BILL ID */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill ID
            </label>

            <input
              type="text"
              name="bill_id"
              value={form.bill_id}
              onChange={handleChange}
              placeholder="Example: BILL-001"
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
                  key={
                    patient.id ||
                    patient.patient_id
                  }
                  value={patient.patient_id}
                >
                  {patient.patient_id} -{" "}
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          {/* DATE */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill Date
            </label>

            <input
              type="date"
              name="bill_date"
              value={form.bill_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* CONSULTATION */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consultation Fee
            </label>

            <input
              type="number"
              name="consultation_fee"
              value={form.consultation_fee}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* MEDICINE */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicine Fee
            </label>

            <input
              type="number"
              name="medicine_fee"
              value={form.medicine_fee}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* LAB */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lab Fee
            </label>

            <input
              type="number"
              name="lab_fee"
              value={form.lab_fee}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ROOM */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Fee
            </label>

            <input
              type="number"
              name="room_fee"
              value={form.room_fee}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* OTHER */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Charges
            </label>

            <input
              type="number"
              name="other_charges"
              value={form.other_charges}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PAYMENT STATUS */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>

            <select
              name="payment_status"
              value={form.payment_status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pending">
                Pending
              </option>

              <option value="Partially Paid">
                Partially Paid
              </option>

              <option value="Paid">
                Paid
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>
          </div>

          {/* TOTAL */}

          <div className="md:col-span-2 lg:col-span-3">

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">

              <p className="text-sm text-gray-500">
                Total Amount
              </p>

              <p className="text-3xl font-bold text-blue-700 mt-1">
                ₹{liveTotal.toFixed(2)}
              </p>

            </div>

          </div>

          {/* BUTTONS */}

          <div className="md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-3">

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Bill"
                : "Create Bill"}
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
              Billing Records
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Search, edit, print and manage bills.
            </p>
          </div>

          <div className="w-full md:w-96">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search Bill ID or Patient ID..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading billing records...
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-10 text-center">

            <p className="text-gray-500 text-lg">
              No bills found.
            </p>

            <p className="text-gray-400 text-sm mt-2">
              Create a bill using the form above.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px]">

              <thead className="bg-gray-100">

                <tr>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Bill
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Patient
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Total
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Payment
                  </th>

                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200">

                {filteredBills.map((bill) => {

                  const patient = patients.find(
                    (p) =>
                      String(
                        p.patient_id
                      ) ===
                      String(
                        bill.patient_id
                      )
                  );

                  return (
                    <tr
                      key={bill.id}
                      className="hover:bg-gray-50"
                    >

                      {/* BILL */}

                      <td className="px-5 py-4">

                        <div className="font-semibold text-gray-800">
                          {bill.bill_id}
                        </div>

                        <div className="text-xs text-gray-400">
                          ID: {bill.id}
                        </div>

                      </td>

                      {/* PATIENT */}

                      <td className="px-5 py-4">

                        <div className="font-medium text-gray-800">
                          {patient?.name ||
                            bill.patient_id ||
                            "-"}
                        </div>

                        <div className="text-xs text-gray-400">
                          {bill.patient_id}
                        </div>

                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-gray-700">
                        {String(
                          bill.bill_date ||
                            "-"
                        ).slice(0, 10)}
                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4">

                        <span className="font-bold text-gray-800">
                          ₹
                          {numberValue(
                            bill.total_amount
                          ).toFixed(2)}
                        </span>

                      </td>

                      {/* PAYMENT */}

                      <td className="px-5 py-4">

                        <select
                          value={
                            bill.payment_status ||
                            "Pending"
                          }
                          onChange={(e) =>
                            handlePaymentStatus(
                              bill,
                              e.target.value
                            )
                          }
                          className={`px-3 py-2 rounded-full text-sm font-semibold border-0 ${
                            bill.payment_status ===
                            "Paid"
                              ? "bg-green-100 text-green-700"
                              : bill.payment_status ===
                                "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >

                          <option value="Pending">
                            Pending
                          </option>

                          <option value="Partially Paid">
                            Partially Paid
                          </option>

                          <option value="Paid">
                            Paid
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
                              handleEdit(bill)
                            }
                            className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-yellow-600"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handlePrint(bill)
                            }
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                          >
                            Print
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                bill.id
                              )
                            }
                            disabled={
                              deletingId ===
                              bill.id
                            }
                            className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingId ===
                            bill.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Billing;