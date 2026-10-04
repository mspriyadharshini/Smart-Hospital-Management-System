import { useEffect, useState } from "react";

function Doctors() {
  const API_URL = "http://127.0.0.1:5000/api/doctors";

  const [doctors, setDoctors] = useState([]);

  const [formData, setFormData] = useState({
    doctor_id: "",
    name: "",
    specialization: "",
    phone: "",
    email: "",
    experience: "",
    availability: "Available",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [search, setSearch] = useState("");
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // ==========================================
  // SHOW MESSAGE
  // ==========================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      doctor_id: "",
      name: "",
      specialization: "",
      phone: "",
      email: "",
      experience: "",
      availability: "Available",
    });

    setEditingDoctor(null);
  };

  // ==========================================
  // GET ALL DOCTORS
  // ==========================================

  const fetchDoctors = async () => {
    setFetching(true);

    try {
      const response = await fetch(API_URL);

      const data = await response.json();

      if (response.ok) {
        setDoctors(data);
      } else {
        showMessage(
          data.error ||
            data.message ||
            "Unable to load doctors",
          "error"
        );
      }
    } catch (error) {
      console.error(error);

      showMessage(
        "Flask server connection failed",
        "error"
      );
    } finally {
      setFetching(false);
    }
  };

  // ==========================================
  // LOAD DOCTORS
  // ==========================================

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone: allow numbers only
    if (name === "phone") {
      const onlyNumbers = value.replace(/\D/g, "");

      setFormData({
        ...formData,
        phone: onlyNumbers,
      });

      return;
    }

    // Experience: allow only numbers
    if (name === "experience") {
      const onlyNumbers = value.replace(/\D/g, "");

      setFormData({
        ...formData,
        experience: onlyNumbers,
      });

      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    const doctorId = formData.doctor_id.trim();
    const name = formData.name.trim();
    const specialization =
      formData.specialization.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();
    const experience = formData.experience;

    // Doctor ID
    if (!doctorId) {
      showMessage(
        "Please enter Doctor ID",
        "error"
      );
      return false;
    }

    if (doctorId.length < 2) {
      showMessage(
        "Doctor ID must contain at least 2 characters",
        "error"
      );
      return false;
    }

    // Doctor Name
    if (!name) {
      showMessage(
        "Please enter doctor name",
        "error"
      );
      return false;
    }

    if (name.length < 2) {
      showMessage(
        "Doctor name must contain at least 2 characters",
        "error"
      );
      return false;
    }

    // Specialization
    if (!specialization) {
      showMessage(
        "Please select specialization",
        "error"
      );
      return false;
    }

    // Phone
    if (phone && !/^\d{10}$/.test(phone)) {
      showMessage(
        "Phone number must contain exactly 10 digits",
        "error"
      );
      return false;
    }

    // Email
    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      showMessage(
        "Please enter a valid email address",
        "error"
      );
      return false;
    }

    // Experience
    if (experience !== "") {
      const experienceNumber = Number(experience);

      if (
        !Number.isInteger(experienceNumber) ||
        experienceNumber < 0 ||
        experienceNumber > 60
      ) {
        showMessage(
          "Experience must be between 0 and 60 years",
          "error"
        );
        return false;
      }
    }

    return true;
  };

  // ==========================================
  // ADD / UPDATE DOCTOR
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        doctor_id: formData.doctor_id.trim(),
        name: formData.name.trim(),
        specialization:
          formData.specialization.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        experience:
          formData.experience === ""
            ? null
            : Number(formData.experience),
        availability:
          formData.availability,
      };

      let response;

      if (editingDoctor) {
        response = await fetch(
          `${API_URL}/${editingDoctor.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        showMessage(
          data.error ||
            data.message ||
            "Doctor operation failed",
          "error"
        );

        return;
      }

      if (editingDoctor) {
        showMessage(
          "Doctor updated successfully",
          "success"
        );
      } else {
        showMessage(
          "Doctor added successfully",
          "success"
        );
      }

      resetForm();

      await fetchDoctors();
    } catch (error) {
      console.error(error);

      showMessage(
        "Server error. Please check Flask backend.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EDIT DOCTOR
  // ==========================================

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);

    setFormData({
      doctor_id: doctor.doctor_id || "",
      name: doctor.name || "",
      specialization:
        doctor.specialization || "",
      phone: doctor.phone || "",
      email: doctor.email || "",
      experience:
        doctor.experience !== null &&
        doctor.experience !== undefined
          ? String(doctor.experience)
          : "",
      availability:
        doctor.availability || "Available",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DELETE DOCTOR
  // ==========================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this doctor?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

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
        "Doctor deleted successfully",
        "success"
      );

      await fetchDoctors();

      if (editingDoctor?.id === id) {
        resetForm();
      }
    } catch (error) {
      console.error(error);

      showMessage(
        "Server error. Please check Flask backend.",
        "error"
      );
    }
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    resetForm();

    showMessage(
      "Edit cancelled",
      "success"
    );
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredDoctors = doctors.filter(
    (doctor) => {
      const searchText =
        search.toLowerCase().trim();

      return (
        doctor.name
          ?.toLowerCase()
          .includes(searchText) ||

        doctor.doctor_id
          ?.toLowerCase()
          .includes(searchText) ||

        doctor.specialization
          ?.toLowerCase()
          .includes(searchText) ||

        doctor.phone
          ?.toString()
          .includes(searchText) ||

        doctor.email
          ?.toLowerCase()
          .includes(searchText)
      );
    }
  );

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">

      <div className="max-w-7xl mx-auto">

        {/* ==================================
            PAGE HEADER
        ================================== */}

        <div className="mb-6 md:mb-8">

          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Doctor Management
          </h1>

          <p className="text-gray-500 mt-1">
            Add and manage hospital doctors
          </p>

        </div>

        {/* ==================================
            NOTIFICATION
        ================================== */}

        {message && (
          <div
            className={`mb-5 p-4 rounded-lg border ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >

            <div className="flex items-center justify-between gap-3">

              <span className="font-medium">
                {message}
              </span>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setMessageType("");
                }}
                className="font-bold text-lg"
              >
                ×
              </button>

            </div>

          </div>
        )}

        {/* ==================================
            DOCTOR FORM
        ================================== */}

        <div className="bg-white rounded-2xl shadow p-4 md:p-6 lg:p-8 mb-6 md:mb-8">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

            <div>

              <h2 className="text-xl font-bold text-gray-800">

                {editingDoctor
                  ? "✏️ Edit Doctor"
                  : "➕ Add New Doctor"}

              </h2>

              <p className="text-gray-500 text-sm mt-1">

                {editingDoctor
                  ? "Update doctor information"
                  : "Enter doctor information"}

              </p>

            </div>

            {editingDoctor && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel Edit
              </button>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
          >

            {/* DOCTOR ID */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Doctor ID{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                placeholder="D001"
                maxLength="50"
                disabled={!!editingDoctor}
                className={`w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 ${
                  editingDoctor
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />

            </div>

            {/* NAME */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Doctor Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. Arun Kumar"
                maxLength="100"
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* SPECIALIZATION */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Specialization{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="">
                  Select Specialization
                </option>

                <option value="Cardiologist">
                  Cardiologist
                </option>

                <option value="Neurologist">
                  Neurologist
                </option>

                <option value="Orthopedic">
                  Orthopedic
                </option>

                <option value="Dermatologist">
                  Dermatologist
                </option>

                <option value="Pediatrician">
                  Pediatrician
                </option>

                <option value="General Physician">
                  General Physician
                </option>

                <option value="Gynecologist">
                  Gynecologist
                </option>

                <option value="ENT Specialist">
                  ENT Specialist
                </option>

              </select>

            </div>

            {/* PHONE */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Phone
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength="10"
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="text-xs text-gray-400 mt-1">
                Enter 10 digit phone number
              </p>

            </div>

            {/* EMAIL */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@gmail.com"
                maxLength="100"
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* EXPERIENCE */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Experience
              </label>

              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="10"
                min="0"
                max="60"
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="text-xs text-gray-400 mt-1">
                Maximum 60 years
              </p>

            </div>

            {/* AVAILABILITY */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Availability
              </label>

              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="Available">
                  Available
                </option>

                <option value="Busy">
                  Busy
                </option>

                <option value="On Leave">
                  On Leave
                </option>

              </select>

            </div>

            {/* BUTTON */}

            <div className="lg:col-span-4 flex flex-wrap justify-start lg:justify-end gap-3">

              <button
                type="submit"
                disabled={loading}
                className={`text-white px-8 py-3 rounded-lg font-semibold ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >

                {loading
                  ? "Saving..."
                  : editingDoctor
                  ? "💾 Update Doctor"
                  : "➕ Add Doctor"}

              </button>

            </div>

          </form>

        </div>

        {/* ==================================
            DOCTOR LIST
        ================================== */}

        <div className="bg-white rounded-2xl shadow p-4 md:p-6 lg:p-8">

          {/* LIST HEADER */}

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

            <div>

              <h2 className="text-xl font-bold">
                Doctor List
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Showing {filteredDoctors.length} of{" "}
                {doctors.length} doctors
              </p>

            </div>

            {/* SEARCH */}

            <input
              type="text"
              placeholder="🔍 Search doctor..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="border rounded-lg p-3 w-full md:w-72 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>

                <tr className="bg-gray-50 border-b">

                  <th className="text-left p-4">
                    ID
                  </th>

                  <th className="text-left p-4">
                    Doctor
                  </th>

                  <th className="text-left p-4">
                    Specialization
                  </th>

                  <th className="text-left p-4">
                    Phone
                  </th>

                  <th className="text-left p-4">
                    Experience
                  </th>

                  <th className="text-left p-4">
                    Availability
                  </th>

                  <th className="text-left p-4">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {fetching ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="text-center p-10 text-gray-500"
                    >
                      Loading doctors...
                    </td>

                  </tr>

                ) : filteredDoctors.length > 0 ? (

                  filteredDoctors.map(
                    (doctor) => (

                      <tr
                        key={doctor.id}
                        className="border-b hover:bg-gray-50"
                      >

                        {/* ID */}

                        <td className="p-4 font-semibold text-blue-600">
                          {doctor.doctor_id}
                        </td>

                        {/* NAME */}

                        <td className="p-4">

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              👨‍⚕️
                            </div>

                            <div>

                              <p className="font-semibold">
                                {doctor.name}
                              </p>

                              <p className="text-xs text-gray-500">
                                {doctor.email || "-"}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* SPECIALIZATION */}

                        <td className="p-4">

                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm whitespace-nowrap">
                            {doctor.specialization}
                          </span>

                        </td>

                        {/* PHONE */}

                        <td className="p-4">
                          {doctor.phone || "-"}
                        </td>

                        {/* EXPERIENCE */}

                        <td className="p-4">
                          {doctor.experience ?? 0} years
                        </td>

                        {/* AVAILABILITY */}

                        <td className="p-4">

                          <span
                            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                              doctor.availability ===
                              "Available"
                                ? "bg-green-100 text-green-700"
                                : doctor.availability ===
                                  "Busy"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {doctor.availability}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="p-4">

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(doctor)
                              }
                              className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200 whitespace-nowrap"
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  doctor.id
                                )
                              }
                              className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 whitespace-nowrap"
                            >
                              🗑️ Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                ) : (

                  <tr>

                    <td
                      colSpan="7"
                      className="text-center p-10 text-gray-500"
                    >
                      No doctors found
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Doctors;