import React, { useState } from "react";
import backgroundVideo from "./assets/Background video.mp4";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function Register({ onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Please enter username.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!role) {
      setError("Please select your account type.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password: password,
            confirm_password: confirmPassword,
            role: role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to create account."
        );
        return;
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("");

      setTimeout(() => {
        if (onBackToLogin) {
          onBackToLogin();
        }
      }, 1800);

    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to server. Please start Flask."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* =================================
          BACKGROUND VIDEO
      ================================= */}

      <video
        autoPlay
        loop
        muted
        playsInline
        className="
          fixed
          inset-0
          w-full
          h-full
          object-cover
          -z-20
        "
      >
        <source
          src={backgroundVideo}
          type="video/mp4"
        />
      </video>

      {/* =================================
          DARK OVERLAY
      ================================= */}

      <div
        className="
          fixed
          inset-0
          bg-black/60
          backdrop-blur-[2px]
          -z-10
        "
      />

      {/* =================================
          MAIN CONTENT
      ================================= */}

      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          px-4
          py-8
        "
      >

        <div className="w-full max-w-lg">

          {/* =================================
              LOGO / TITLE
          ================================= */}

          <div className="text-center mb-5">

            <div
              className="
                inline-flex
                items-center
                justify-center
                w-16
                h-16
                rounded-full
                bg-white/20
                backdrop-blur-md
                border
                border-white/30
                shadow-xl
                mb-3
              "
            >
              <span className="text-4xl">
                🏥
              </span>
            </div>

            <h1
              className="
                text-3xl
                md:text-4xl
                font-bold
                text-white
                drop-shadow-lg
              "
            >
              Smart Hospital
            </h1>

            <p className="text-white/80 mt-1">
              Hospital Management System
            </p>

          </div>

          {/* =================================
              GLASS CARD
          ================================= */}

          <div
            className="
              bg-white/15
              backdrop-blur-xl
              border
              border-white/30
              rounded-3xl
              shadow-2xl
              p-6
              md:p-8
            "
          >

            <h2
              className="
                text-2xl
                font-bold
                text-white
                text-center
                mb-1
              "
            >
              Create Account
            </h2>

            <p
              className="
                text-white/70
                text-center
                mb-6
              "
            >
              Register your personal account
            </p>

            {/* ERROR */}

            {error && (
              <div
                className="
                  bg-red-500/90
                  text-white
                  rounded-xl
                  px-4
                  py-3
                  mb-5
                  text-center
                  font-medium
                "
              >
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div
                className="
                  bg-green-500/90
                  text-white
                  rounded-xl
                  px-4
                  py-3
                  mb-5
                  text-center
                  font-medium
                "
              >
                {success}
              </div>
            )}

            <form onSubmit={handleRegister}>

              {/* USERNAME */}

              <div className="mb-4">

                <label className="block text-white font-semibold mb-2">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="Create your username"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    bg-white/90
                    text-gray-900
                    placeholder-gray-500
                    outline-none
                    border-2
                    border-transparent
                    focus:border-blue-400
                    transition
                  "
                  required
                />

              </div>

              {/* EMAIL */}

              <div className="mb-4">

                <label className="block text-white font-semibold mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    bg-white/90
                    text-gray-900
                    placeholder-gray-500
                    outline-none
                    border-2
                    border-transparent
                    focus:border-blue-400
                    transition
                  "
                  required
                />

              </div>

              {/* PASSWORD */}

              <div className="mb-4">

                <label className="block text-white font-semibold mb-2">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Create password"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    bg-white/90
                    text-gray-900
                    placeholder-gray-500
                    outline-none
                    border-2
                    border-transparent
                    focus:border-blue-400
                    transition
                  "
                  required
                />

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="mb-4">

                <label className="block text-white font-semibold mb-2">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Confirm your password"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    bg-white/90
                    text-gray-900
                    placeholder-gray-500
                    outline-none
                    border-2
                    border-transparent
                    focus:border-blue-400
                    transition
                  "
                  required
                />

              </div>

              {/* ROLE */}

              <div className="mb-6">

                <label className="block text-white font-semibold mb-2">
                  Account Type
                </label>

                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setError("");
                  }}
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    bg-white/90
                    text-gray-900
                    outline-none
                    border-2
                    border-transparent
                    focus:border-blue-400
                    transition
                  "
                  required
                >

                  <option value="">
                    Select Account Type
                  </option>

                  <option value="Admin">
                    Admin
                  </option>

                  <option value="Doctor">
                    Doctor
                  </option>

                </select>

              </div>

              {/* CREATE ACCOUNT */}

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  py-3.5
                  rounded-xl
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:bg-blue-400
                  text-white
                  font-bold
                  text-lg
                  shadow-lg
                  transition
                  transform
                  hover:scale-[1.01]
                "
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>

            {/* BACK TO LOGIN */}

            <button
              type="button"
              onClick={onBackToLogin}
              className="
                w-full
                mt-5
                text-white
                font-semibold
                hover:text-blue-200
                transition
              "
            >
              ← Back to Login
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;