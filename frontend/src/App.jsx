import React, { useEffect, useState } from "react";

import Login from "./pages/Login";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import Doctors from "./pages/Doctors";
import Billing from "./pages/Billing";
import Pharmacy from "./pages/Pharmacy";
import Beds from "./pages/Beds";
import Users from "./pages/Users";
import Admission from "./pages/Admission";
import Register from "./Register";
import hospitalBackground from "./assets/hospital-background.jpg";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [dashboard, setDashboard] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    medicines: 0,
    bills: 0,
    paid_revenue: 0,
    total_beds: 0,
    available_beds: 0,
    occupied_beds: 0,
    maintenance_beds: 0,
  });

  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  // =====================================================
  // LOGIN CHECK
  // =====================================================
  useEffect(() => {
    const savedUser = localStorage.getItem("smartHospitalUser");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Saved user error:", error);

        localStorage.removeItem("smartHospitalUser");
      }
    }
  }, []);

  // =====================================================
  // DASHBOARD DATA
  // =====================================================
  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    setDashboardError("");

    try {
      const response = await fetch(
        `${API_URL}/api/dashboard`
      );

      if (!response.ok) {
        throw new Error("Dashboard API failed");
      }

      const data = await response.json();

      setDashboard({
        patients:
          data.patients ??
          data.total_patients ??
          data.patient_count ??
          0,

        doctors:
          data.doctors ??
          data.total_doctors ??
          data.doctor_count ??
          0,

        appointments:
          data.appointments ??
          data.total_appointments ??
          data.appointment_count ??
          0,

        medicines:
          data.medicines ??
          data.total_medicines ??
          data.medicine_count ??
          0,

        bills:
          data.bills ??
          data.total_bills ??
          data.bill_count ??
          0,

        paid_revenue:
          data.paid_revenue ??
          data.revenue ??
          data.total_revenue ??
          0,

        total_beds:
          data.total_beds ??
          data.beds ??
          0,

        available_beds:
          data.available_beds ??
          0,

        occupied_beds:
          data.occupied_beds ??
          0,

        maintenance_beds:
          data.maintenance_beds ??
          0,
      });
    } catch (error) {
      console.error("Dashboard error:", error);

      setDashboardError(
        "Unable to load dashboard data. Please check Flask backend."
      );
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboard();
    }
  }, [isLoggedIn]);

  // =====================================================
  // LOGIN
  // =====================================================
  const handleLogin = (data) => {
    const loggedUser = data.user || data;

    console.log("Logged in user:", loggedUser);

    setUser(loggedUser);
    setIsLoggedIn(true);
    setPage("dashboard");

    localStorage.setItem(
      "smartHospitalUser",
      JSON.stringify(loggedUser)
    );
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {
    localStorage.removeItem("smartHospitalUser");

    setUser(null);
    setIsLoggedIn(false);
    setPage("dashboard");
    setMobileMenu(false);
  };

  // =====================================================
  // LOGIN PAGE
  // =====================================================
  if (!isLoggedIn) {

  if (showRegister) {

    return (
      <Register
        onBackToLogin={() => {
          setShowRegister(false);
        }}
      />
    );

  }

  return (
    <Login
      onLogin={handleLogin}
      onRegister={() => {
        setShowRegister(true);
      }}
    />
  );
}

  // =====================================================
  // USER ROLE
  // =====================================================
  const role =
    user?.role ||
    user?.user_role ||
    "Admin";

  // =====================================================
  // PERMISSIONS
  // =====================================================

  const canAccessPatients =
    role === "Admin" ||
    role === "Doctor" ||
    role === "Receptionist";

  const canAccessAppointments =
    role === "Admin" ||
    role === "Doctor" ||
    role === "Receptionist";

  const canAccessDoctors =
    role === "Admin";

  const canAccessBilling =
    role === "Admin" ||
    role === "Receptionist" ||
    role === "Accountant";

  const canAccessPharmacy =
    role === "Admin" ||
    role === "Pharmacist";

  const canAccessBeds =
    role === "Admin" ||
    role === "Doctor" ||
    role === "Receptionist";

  const canAccessUsers =
    role === "Admin";

  // =====================================================
  // PAGE NAVIGATION
  // =====================================================
  const goToPage = (targetPage) => {
    let allowed = true;

    if (targetPage === "patients") {
      allowed = canAccessPatients;
    }

    if (targetPage === "appointments") {
      allowed = canAccessAppointments;
    }

    if (targetPage === "doctors") {
      allowed = canAccessDoctors;
    }

    if (targetPage === "billing") {
      allowed = canAccessBilling;
    }

    if (targetPage === "pharmacy") {
      allowed = canAccessPharmacy;
    }

    if (targetPage === "beds") {
      allowed = canAccessBeds;
    }

    if (targetPage === "users") {
      allowed = canAccessUsers;
    }

    if (targetPage === "admission") {
      allowed = canAccessBeds;
    }

    if (!allowed) {
      return;
    }

    setPage(targetPage);
    setMobileMenu(false);

    if (targetPage === "dashboard") {
      fetchDashboard();
    }
  };

  // =====================================================
  // MENU BUTTON CLASS
  // =====================================================
  const menuButtonClass = (target) => {
    return `
      w-full
      text-left
      px-5
      py-3
      rounded-xl
      flex
      items-center
      gap-3
      font-medium
      transition-all
      duration-200
      ${
        page === target
          ? "bg-blue-600 text-white shadow-lg"
          : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
      }
    `;
  };

  // =====================================================
  // SIDEBAR
  // =====================================================
  const SidebarContent = () => (
    <div className="h-full flex flex-col">

      {/* USER INFO */}
      <div className="mb-6 rounded-xl bg-blue-50 p-4">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl">
            👤
          </div>

          <div>
            <p className="font-bold text-slate-800">
              {user?.username || "User"}
            </p>

            <p className="text-sm text-blue-600 font-semibold">
              {role}
            </p>
          </div>

        </div>

      </div>

      {/* MENU TITLE */}
      <div className="mb-4">

        <h2 className="text-xl font-bold text-slate-800">
          Menu
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          Hospital Management
        </p>

      </div>

      {/* MENU */}
      <div className="space-y-2">

        {/* DASHBOARD */}
        <button
          onClick={() => goToPage("dashboard")}
          className={menuButtonClass("dashboard")}
        >
          🏠
          <span>Dashboard</span>
        </button>

        {/* PATIENTS */}
        {canAccessPatients && (
          <button
            onClick={() => goToPage("patients")}
            className={menuButtonClass("patients")}
          >
            👥
            <span>Patients</span>
          </button>
        )}

        {/* APPOINTMENTS */}
        {canAccessAppointments && (
          <button
            onClick={() => goToPage("appointments")}
            className={menuButtonClass("appointments")}
          >
            🗓️
            <span>Appointments</span>
          </button>
        )}

        {/* DOCTORS */}
        {canAccessDoctors && (
          <button
            onClick={() => goToPage("doctors")}
            className={menuButtonClass("doctors")}
          >
            🩺
            <span>Doctors</span>
          </button>
        )}

        {/* BILLING */}
        {canAccessBilling && (
          <button
            onClick={() => goToPage("billing")}
            className={menuButtonClass("billing")}
          >
            💰
            <span>Billing</span>
          </button>
        )}

        {/* PHARMACY */}
        {canAccessPharmacy && (
          <button
            onClick={() => goToPage("pharmacy")}
            className={menuButtonClass("pharmacy")}
          >
            💊
            <span>Pharmacy</span>
          </button>
        )}

        {/* BEDS */}
        {canAccessBeds && (
          <button
            onClick={() => goToPage("beds")}
            className={menuButtonClass("beds")}
          >
            🛏️
            <span>Bed Management</span>
          </button>
        )}

        {/* ADMISSION */}
        {canAccessBeds && (
          <button
            onClick={() => goToPage("admission")}
            className={menuButtonClass("admission")}
          >
            🏥
            <span>Admission</span>
          </button>
        )}

        {/* USERS */}
        {canAccessUsers && (
          <button
            onClick={() => goToPage("users")}
            className={menuButtonClass("users")}
          >
            👤
            <span>User Management</span>
          </button>
        )}

      </div>

      {/* BOTTOM USER INFO */}
      <div className="mt-auto pt-8">

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">

          <p className="text-xs text-slate-500">
            Logged in as
          </p>

          <p className="font-bold text-blue-700 mt-1">
            {user?.username || "User"}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Role: {role}
          </p>

        </div>

      </div>

    </div>
  );

  // =====================================================
  // STAT CARD
  // =====================================================
  const StatCard = ({
    title,
    value,
    icon,
    valueClass = "text-blue-600",
  }) => (
    <div
      className="
        bg-white/95
        backdrop-blur-md
        rounded-2xl
        shadow-xl
        p-6
        border
        border-white/70
        hover:scale-[1.02]
        transition-all
        duration-200
      "
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p
            className={`text-3xl font-bold mt-2 ${valueClass}`}
          >
            {value}
          </p>

        </div>

        <div className="text-4xl">
          {icon}
        </div>

      </div>

    </div>
  );

  // =====================================================
  // DASHBOARD
  // =====================================================
  const Dashboard = () => (
    <div
      className="min-h-[calc(100vh-88px)] bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `
          linear-gradient(
            rgba(15, 23, 42, 0.48),
            rgba(15, 23, 42, 0.48)
          ),
          url(${hospitalBackground})
        `,
      }}
    >

      <div className="p-4 md:p-8">

        {/* DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

          <div>

            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
              Dashboard
            </h1>

            <p className="text-white/90 mt-1 drop-shadow">
              Welcome, {user?.username || "User"}
            </p>

            <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">

              <span className="text-white text-sm">
                Role:
              </span>

              <span className="text-white font-bold text-sm">
                {role}
              </span>

            </div>

          </div>

          <button
            onClick={fetchDashboard}
            disabled={loadingDashboard}
            className="
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-blue-400
              text-white
              px-5
              py-3
              rounded-xl
              font-semibold
              shadow-lg
            "
          >
            🔄{" "}
            {loadingDashboard
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {/* ERROR */}
        {dashboardError && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-5 py-4 rounded-xl">
            {dashboardError}
          </div>
        )}

        {/* STATISTICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <StatCard
            title="Total Patients"
            value={dashboard.patients}
            icon="👥"
            valueClass="text-blue-600"
          />

          <StatCard
            title="Total Doctors"
            value={dashboard.doctors}
            icon="🩺"
            valueClass="text-green-600"
          />

          <StatCard
            title="Appointments"
            value={dashboard.appointments}
            icon="🗓️"
            valueClass="text-purple-600"
          />

          <StatCard
            title="Medicines"
            value={dashboard.medicines}
            icon="💊"
            valueClass="text-orange-600"
          />

          <StatCard
            title="Total Bills"
            value={dashboard.bills}
            icon="📄"
            valueClass="text-red-600"
          />

          <StatCard
            title="Paid Revenue"
            value={`₹${Number(
              dashboard.paid_revenue || 0
            ).toFixed(2)}`}
            icon="💰"
            valueClass="text-green-600"
          />

          <StatCard
            title="Total Beds"
            value={dashboard.total_beds}
            icon="🛏️"
            valueClass="text-blue-600"
          />

          <StatCard
            title="Available Beds"
            value={dashboard.available_beds}
            icon="✅"
            valueClass="text-green-600"
          />

        </div>

        {/* BED STATUS */}
        <div className="mt-7 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6">

          <div className="flex items-center gap-3 mb-5">

            <span className="text-2xl">
              🛏️
            </span>

            <h2 className="text-xl font-bold text-slate-800">
              Bed Status
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* AVAILABLE */}
            <div className="rounded-xl bg-green-50 border border-green-200 p-5">

              <p className="text-slate-600">
                Available
              </p>

              <p className="text-3xl font-bold text-green-600 mt-2">
                {dashboard.available_beds}
              </p>

            </div>

            {/* OCCUPIED */}
            <div className="rounded-xl bg-red-50 border border-red-200 p-5">

              <p className="text-slate-600">
                Occupied
              </p>

              <p className="text-3xl font-bold text-red-600 mt-2">
                {dashboard.occupied_beds}
              </p>

            </div>

            {/* MAINTENANCE */}
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-5">

              <p className="text-slate-600">
                Maintenance
              </p>

              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {dashboard.maintenance_beds}
              </p>

            </div>

          </div>

        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-7 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6">

          <h2 className="text-xl font-bold text-slate-800 mb-5">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {canAccessPatients && (
              <button
                onClick={() => goToPage("patients")}
                className="
                  p-5
                  rounded-xl
                  bg-blue-50
                  hover:bg-blue-100
                  text-blue-700
                  font-semibold
                  transition
                "
              >
                👥
                <br />
                Patients
              </button>
            )}

            {canAccessAppointments && (
              <button
                onClick={() => goToPage("appointments")}
                className="
                  p-5
                  rounded-xl
                  bg-purple-50
                  hover:bg-purple-100
                  text-purple-700
                  font-semibold
                  transition
                "
              >
                🗓️
                <br />
                Appointments
              </button>
            )}

            {canAccessBilling && (
              <button
                onClick={() => goToPage("billing")}
                className="
                  p-5
                  rounded-xl
                  bg-green-50
                  hover:bg-green-100
                  text-green-700
                  font-semibold
                  transition
                "
              >
                💰
                <br />
                Billing
              </button>
            )}

            {canAccessBeds && (
              <button
                onClick={() => goToPage("admission")}
                className="
                  p-5
                  rounded-xl
                  bg-orange-50
                  hover:bg-orange-100
                  text-orange-700
                  font-semibold
                  transition
                "
              >
                🏥
                <br />
                Admission
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  );

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <div className="min-h-screen bg-slate-100">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="h-[88px] bg-blue-700 text-white flex items-center justify-between px-4 md:px-6 shadow-lg relative z-50">

        <div className="flex items-center gap-3">

          {/* MOBILE MENU */}
          <button
            onClick={() =>
              setMobileMenu(!mobileMenu)
            }
            className="
              md:hidden
              text-2xl
              bg-blue-600
              px-3
              py-2
              rounded-lg
            "
          >
            ☰
          </button>

          <div>

            <h1 className="text-xl md:text-2xl font-bold">
              Smart Hospital Management System
            </h1>

            <p className="text-sm text-blue-100 mt-1">
              Hospital Administration Dashboard
            </p>

          </div>

        </div>

        {/* HEADER USER */}
        <div className="flex items-center gap-4">

          <div className="hidden md:block text-right">

            <p className="font-bold">
              {user?.username || "User"}
            </p>

            <p className="text-sm text-blue-100">
              {role}
            </p>

          </div>

          <button
            onClick={handleLogout}
            className="
              bg-red-500
              hover:bg-red-600
              px-5
              py-3
              rounded-xl
              font-bold
              shadow-lg
            "
          >
            Logout
          </button>

        </div>

      </header>

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {mobileMenu && (
        <div
          className="
            fixed
            inset-0
            bg-black/40
            z-40
            md:hidden
          "
          onClick={() => setMobileMenu(false)}
        ></div>
      )}

      {/* =================================================
          MOBILE SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed
          top-[88px]
          left-0
          bottom-0
          w-72
          bg-white
          z-50
          p-5
          shadow-2xl
          transform
          transition-transform
          duration-300
          md:hidden
          ${
            mobileMenu
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <SidebarContent />
      </aside>

      {/* =================================================
          DESKTOP SIDEBAR
      ================================================= */}

      <aside
        className="
          hidden
          md:block
          fixed
          left-0
          top-[88px]
          bottom-0
          w-72
          bg-white
          shadow-lg
          p-5
          z-30
          overflow-y-auto
        "
      >
        <SidebarContent />
      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="md:ml-72 min-h-[calc(100vh-88px)]">

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <Dashboard />
        )}

        {/* PATIENTS */}
        {page === "patients" &&
          canAccessPatients && (
            <div className="p-4 md:p-6 bg-slate-100 min-h-[calc(100vh-88px)]">
              <Patients />
            </div>
          )}

        {/* APPOINTMENTS */}
        {page === "appointments" &&
          canAccessAppointments && (
            <div className="p-4 md:p-6 bg-slate-100 min-h-[calc(100vh-88px)]">
              <Appointments />
            </div>
          )}

        {/* DOCTORS */}
        {page === "doctors" &&
          canAccessDoctors && (
            <div className="p-4 md:p-6 bg-slate-100 min-h-[calc(100vh-88px)]">
              <Doctors />
            </div>
          )}

        {/* BILLING */}
        {page === "billing" &&
          canAccessBilling && (
            <div className="p-4 md:p-6 bg-slate-100 min-h-[calc(100vh-88px)]">
              <Billing />
            </div>
          )}

        {/* PHARMACY */}
        {page === "pharmacy" &&
          canAccessPharmacy && (
            <div className="p-4 md:p-6 bg-slate-100 min-h-[calc(100vh-88px)]">
              <Pharmacy />
            </div>
          )}

        {/* BEDS */}
        {page === "beds" &&
          canAccessBeds && (
            <div className="p-4 md:p-6 bg-slate-100 min-h-[calc(100vh-88px)]">
              <Beds />
            </div>
          )}

        {/* USERS */}
        {page === "users" &&
          canAccessUsers && (
            <div className="p-4 md:p-6 bg-slate-100 min-h-[calc(100vh-88px)]">
              <Users />
            </div>
          )}

        {/* ADMISSION */}
        {page === "admission" &&
          canAccessBeds && (
            <div className="p-4 md:p-6 bg-slate-100 min-h-[calc(100vh-88px)]">
              <Admission />
            </div>
          )}

      </main>

    </div>
  );
}

export default App;