import React, { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api/users";

function Users() {
  const [users, setUsers] = useState([]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Receptionist");

  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // MESSAGE
  // =========================

  const showSuccess = (message) => {
    setSuccess(message);
    setError("");

    setTimeout(() => {
      setSuccess("");
    }, 3500);
  };

  const showError = (message) => {
    setError(message);
    setSuccess("");

    setTimeout(() => {
      setError("");
    }, 4000);
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
  // GET USERS
  // =========================

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load users"
        );
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);

      showError(
        error.message || "Backend server is not running"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================
  // CLEAR FORM
  // =========================

  const clearForm = () => {
    setUsername("");
    setPassword("");
    setRole("Receptionist");
    setEditingId(null);
  };

  // =========================
  // VALIDATION
  // =========================

  const validateForm = () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      showError("Username is required.");
      return false;
    }

    if (cleanUsername.length < 3) {
      showError(
        "Username must contain at least 3 characters."
      );
      return false;
    }

    if (cleanUsername.length > 50) {
      showError(
        "Username must not exceed 50 characters."
      );
      return false;
    }

    // Password required only when adding
    if (!editingId && !cleanPassword) {
      showError("Password is required.");
      return false;
    }

    // If password entered during edit, validate it
    if (cleanPassword && cleanPassword.length < 6) {
      showError(
        "Password must contain at least 6 characters."
      );
      return false;
    }

    const validRoles = [
      "Admin",
      "Doctor",
      "Receptionist",
      "Pharmacist",
      "Accountant",
    ];

    if (!validRoles.includes(role)) {
      showError("Please select a valid role.");
      return false;
    }

    return true;
  };

  // =========================
  // ADD / UPDATE USER
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      let response;

      const userData = {
        username: username.trim(),
        password: password.trim(),
        role: role,
      };

      if (editingId) {
        response = await fetch(
          `${API_URL}/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          }
        );
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      }

      const data = await getResponseData(response);

      if (!response.ok) {
        showError(
          data.error ||
            data.message ||
            "Operation failed"
        );
        return;
      }

      showSuccess(
        editingId
          ? "User updated successfully!"
          : "User added successfully!"
      );

      clearForm();

      await fetchUsers();
    } catch (error) {
      console.error(error);

      showError(
        "Unable to connect to backend server."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT USER
  // =========================

  const handleEdit = (user) => {
    setEditingId(user.id);

    setUsername(user.username || "");

    // Password intentionally blank
    setPassword("");

    setRole(user.role || "Receptionist");

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // DELETE USER
  // =========================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
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
        showError(
          data.error ||
            data.message ||
            "Delete failed"
        );
        return;
      }

      showSuccess(
        "User deleted successfully!"
      );

      if (editingId === id) {
        clearForm();
      }

      await fetchUsers();
    } catch (error) {
      console.error(error);

      showError(
        "Unable to connect to backend server."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // SEARCH
  // =========================

  const filteredUsers = users.filter((user) => {
    const searchText = search
      .toLowerCase()
      .trim();

    return (
      String(user.username || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.role || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-6">

      {/* PAGE TITLE */}

      <div>
        <h2 className="text-3xl font-bold text-slate-800">
          User Management
        </h2>

        <p className="text-slate-500 mt-1">
          Manage hospital system users and roles
        </p>
      </div>

      {/* SUCCESS */}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg font-medium">
          {success}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">
          {error}
        </div>
      )}

      {/* USER FORM */}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

          <h3 className="text-xl font-bold text-slate-800">
            {editingId
              ? "Edit User"
              : "Add New User"}
          </h3>

          {editingId && (
            <button
              type="button"
              onClick={clearForm}
              disabled={saving}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Cancel Edit
            </button>
          )}

        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >

          {/* USERNAME */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username *
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter username"
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password {editingId ? "" : "*"}
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder={
                editingId
                  ? "Leave blank to keep old password"
                  : "Enter password"
              }
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />

            {editingId && (
              <p className="text-xs text-slate-500 mt-1">
                Enter a new password only if you
                want to change it.
              </p>
            )}
          </div>

          {/* ROLE */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role *
            </label>

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              disabled={saving}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="Admin">
                Admin
              </option>

              <option value="Doctor">
                Doctor
              </option>

              <option value="Receptionist">
                Receptionist
              </option>

              <option value="Pharmacist">
                Pharmacist
              </option>

              <option value="Accountant">
                Accountant
              </option>
            </select>
          </div>

          {/* BUTTONS */}

          <div className="flex items-end gap-2">

            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                ? "Update User"
                : "Add User"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                disabled={saving}
                className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
            )}

          </div>

        </form>
      </div>

      {/* SEARCH */}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h3 className="text-xl font-bold text-slate-800">
              System Users
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              {filteredUsers.length} user(s)
            </p>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search username or role..."
            className="w-full md:w-80 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

      </div>

      {/* USER TABLE */}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {loading ? (
          <div className="text-center py-10 text-slate-500">
            Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-100">

                <tr>

                  <th className="text-left px-6 py-4 text-sm font-semibold">
                    ID
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold">
                    Username
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold">
                    Role
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold">
                    Created At
                  </th>

                  <th className="text-center px-6 py-4 text-sm font-semibold">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredUsers.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="text-center py-10 text-slate-500"
                    >
                      No users found
                    </td>

                  </tr>

                ) : (

                  filteredUsers.map((user) => (

                    <tr
                      key={user.id}
                      className="border-t hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">
                        {user.id}
                      </td>

                      <td className="px-6 py-4 font-semibold">
                        {user.username}
                      </td>

                      <td className="px-6 py-4">

                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {user.role}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-slate-600">

                        {user.created_at
                          ? new Date(
                              user.created_at
                            ).toLocaleString()
                          : "-"}

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex flex-wrap justify-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(user)
                            }
                            disabled={
                              saving ||
                              deletingId === user.id
                            }
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(user.id)
                            }
                            disabled={
                              saving ||
                              deletingId === user.id
                            }
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                          >
                            {deletingId === user.id
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

export default Users;