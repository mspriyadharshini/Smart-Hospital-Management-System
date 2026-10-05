import React, { useState } from "react";
import backgroundVideo from "./assets/Background video.mp4";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================
  // SEND OTP
  // =========================================

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setDemoOtp("");

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to generate OTP."
        );
        return;
      }

      setStep(2);

      setSuccess(
        "OTP generated successfully. Check Flask terminal."
      );

      if (data.demo_otp) {
        setDemoOtp(data.demo_otp);
      }
    } catch (error) {
      console.error("SEND OTP ERROR:", error);

      setError(
        "Unable to connect to server. Please start Flask."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // RESET PASSWORD
  // =========================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Please enter OTP.");
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must contain 6 digits.");
      return;
    }

    if (!newPassword) {
      setError("Please enter new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            otp: otp.trim(),
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to reset password."
        );
        return;
      }

      setSuccess(
        "Password reset successfully! Please login."
      );

      setTimeout(() => {
        if (onBackToLogin) {
          onBackToLogin();
        }
      }, 2000);

    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);

      setError(
        "Unable to connect to server. Please start Flask."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // BACK
  // =========================================

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess("");
      setDemoOtp("");
      return;
    }

    if (onBackToLogin) {
      onBackToLogin();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* ==============================
          BACKGROUND VIDEO
      ============================== */}

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

      {/* DARK OVERLAY */}

      <div
        className="
          fixed
          inset-0
          bg-black/55
          backdrop-blur-[2px]
          -z-10
        "
      />

      {/* ==============================
          MAIN
      ============================== */}

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

          {/* HEADER */}

          <div className="text-center mb-6">

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
              "
            >
              Smart Hospital
            </h1>

            <p className="text-white/80 mt-1">
              Hospital Management System
            </p>

          </div>

          {/* CARD */}

          <div
            className="
              bg-black/55
              backdrop-blur-xl
              border
              border-white/20
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
                mb-6
              "
            >
              Forgot Password
            </h2>

            {/* ERROR */}

            {error && (
              <div
                className="
                  bg-red-500
                  text-white
                  rounded-xl
                  px-4
                  py-3
                  mb-5
                  text-center
                  font-semibold
                "
              >
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div
                className="
                  bg-green-500
                  text-white
                  rounded-xl
                  px-4
                  py-3
                  mb-5
                  text-center
                  font-semibold
                "
              >
                {success}
              </div>
            )}

            {/* ==============================
                STEP 1
            ============================== */}

            {step === 1 && (

              <form onSubmit={handleSendOTP}>

                <label
                  className="
                    block
                    text-white
                    font-semibold
                    mb-2
                  "
                >
                  Enter Registered Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="example@gmail.com"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    bg-white
                    text-gray-900
                    outline-none
                    border-2
                    border-transparent
                    focus:border-blue-400
                    mb-5
                  "
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full
                    py-3
                    rounded-xl
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:bg-blue-400
                    text-white
                    font-bold
                    text-lg
                  "
                >
                  {loading
                    ? "Generating OTP..."
                    : "Send OTP"}
                </button>

              </form>
            )}

            {/* ==============================
                STEP 2
            ============================== */}

            {step === 2 && (

              <form onSubmit={handleResetPassword}>

                {/* DEMO OTP */}

                {demoOtp && (
                  <div
                    className="
                      bg-yellow-400
                      text-black
                      rounded-xl
                      px-4
                      py-3
                      mb-5
                      text-center
                      font-bold
                    "
                  >
                    Demo OTP: {demoOtp}
                  </div>
                )}

                <label
                  className="
                    block
                    text-white
                    font-semibold
                    mb-2
                  "
                >
                  Enter OTP
                </label>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    );
                    setError("");
                  }}
                  placeholder="Enter 6 digit OTP"
                  maxLength="6"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    bg-white
                    text-gray-900
                    outline-none
                    border-2
                    border-transparent
                    focus:border-blue-400
                    mb-4
                  "
                  required
                />

                <label
                  className="
                    block
                    text-white
                    font-semibold
                    mb-2
                  "
                >
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter new password"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    bg-white
                    text-gray-900
                    outline-none
                    border-2
                    border-transparent
                    focus:border-blue-400
                    mb-4
                  "
                  required
                />

                <label
                  className="
                    block
                    text-white
                    font-semibold
                    mb-2
                  "
                >
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Confirm new password"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    bg-white
                    text-gray-900
                    outline-none
                    border-2
                    border-transparent
                    focus:border-blue-400
                    mb-5
                  "
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full
                    py-3
                    rounded-xl
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:bg-blue-400
                    text-white
                    font-bold
                    text-lg
                  "
                >
                  {loading
                    ? "Resetting Password..."
                    : "Reset Password"}
                </button>

              </form>
            )}

            {/* BACK */}

            <button
              type="button"
              onClick={handleBack}
              className="
                w-full
                mt-5
                text-white
                font-semibold
                hover:text-blue-300
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

export default ForgotPassword;