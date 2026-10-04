import React, { useState } from "react";
import backgroundVideo from "../assets/backgroundvideo.mp4";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
function Login({ onLogin, onRegister }) {
  const [loginType, setLoginType] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showForgot, setShowForgot] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ==============================
  // SELECT LOGIN TYPE
  // ==============================

  const selectLoginType = (type) => {
    setLoginType(type);

    setUsername("");
    setPassword("");
    setError("");
    setSuccess("");
  };

  // ==============================
  // LOGIN
  // ==============================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Please enter username.");
      return;
    }

    if (!password) {
      setError("Please enter password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          expected_role: loginType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Invalid username or password."
        );
        return;
      }

      const user = data.user || data;

      // Extra frontend role check
      if (
        loginType &&
        user.role &&
        user.role.toLowerCase() !== loginType.toLowerCase()
      ) {
        setError(
          `This account is not registered as ${loginType}.`
        );
        return;
      }

      localStorage.setItem(
        "smartHospitalUser",
        JSON.stringify(user)
      );

      if (onLogin) {
        onLogin({
          ...data,
          user: user,
        });
      }
    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to server. Please start Flask backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // SEND OTP
  // ==============================

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/forgot-password/send-otp`,
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
          data.message || "Unable to send OTP."
        );
        return;
      }

      setOtpSent(true);

      setSuccess(
        "OTP sent successfully to your registered email."
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // RESET PASSWORD
  // ==============================

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
        `${API_URL}/api/forgot-password/reset`,
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
        "Password reset successfully. Please login."
      );

      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setShowForgot(false);
        setOtpSent(false);
        setEmail("");
        setSuccess("");
      }, 2500);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // BACK TO LOGIN TYPE
  // ==============================

  const backToLoginSelection = () => {
    setLoginType(null);

    setUsername("");
    setPassword("");

    setError("");
    setSuccess("");
  };

  // ==============================
  // BACK FROM FORGOT PASSWORD
  // ==============================

  const backFromForgot = () => {
    setShowForgot(false);

    setOtpSent(false);

    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");

    setError("");
    setSuccess("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* ==============================
          BACKGROUND VIDEO
      ============================== */}

      <video
        className="fixed inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source
          src={backgroundVideo}
          type="video/mp4"
        />
      </video>

      <div className="fixed inset-0 bg-black/30"></div>

      {/* ==============================
          MAIN CONTENT
      ============================== */}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">

        <div className="w-full max-w-md">

          {/* ==============================
              HEADER
          ============================== */}

          <div className="text-center mb-8">

            <div className="text-6xl mb-3">
              🏥
            </div>

            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              Smart Hospital
            </h1>

            <p className="text-white text-lg mt-2 drop-shadow-md">
              Hospital Management System
            </p>

          </div>


          {/* =====================================================
              1. LOGIN TYPE SELECTION
          ===================================================== */}

          {!loginType && !showForgot && (

            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">

              <h2 className="text-2xl font-bold text-white text-center mb-6">
                Choose Login
              </h2>

              <div className="grid grid-cols-2 gap-4">

                {/* ADMIN */}

                <button
                  type="button"
                  onClick={() =>
                    selectLoginType("Admin")
                  }
                  className="
                    p-6
                    rounded-xl
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    font-bold
                    text-lg
                    shadow-xl
                    transition
                    transform
                    hover:scale-105
                  "
                >

                  <div className="text-4xl mb-3">
                    👨‍💼
                  </div>

                  Admin Login

                </button>


                {/* DOCTOR */}

                <button
                  type="button"
                  onClick={() =>
                    selectLoginType("Doctor")
                  }
                  className="
                    p-6
                    rounded-xl
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    font-bold
                    text-lg
                    shadow-xl
                    transition
                    transform
                    hover:scale-105
                  "
                >

                  <div className="text-4xl mb-3">
                    👨‍⚕️
                  </div>

                  Doctor Login

                </button>

              </div>


              {/* Forgot Password */}

              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setError("");
                  setSuccess("");
                }}
                className="
                  w-full
                  mt-6
                  text-white
                  font-semibold
                  underline
                  hover:text-blue-200
                "
              >
                Forgot Password?
              </button>

            </div>
          )}

          <button
  type="button"
  onClick={onRegister}
  className="
    w-full
    mt-4
    text-white
    font-semibold
    underline
    hover:text-blue-200
  "
>
  Create New Account
</button>


          {/* =====================================================
              2. ADMIN / DOCTOR LOGIN
          ===================================================== */}

          {loginType && !showForgot && (

            <form
              onSubmit={handleLogin}
              className="
                bg-black/30
                backdrop-blur-sm
                rounded-2xl
                p-6
              "
            >

              {/* TITLE */}

              <div className="text-center mb-6">

                <div className="text-4xl mb-2">

                  {loginType === "Admin"
                    ? "👨‍💼"
                    : "👨‍⚕️"}

                </div>

                <h2 className="text-2xl font-bold text-white">

                  {loginType} Login

                </h2>

              </div>


              {/* ERROR */}

              {error && (
                <div className="
                  mb-5
                  bg-red-500/90
                  text-white
                  px-4
                  py-3
                  rounded-lg
                  text-center
                ">
                  {error}
                </div>
              )}


              {/* USERNAME */}

              <div className="mb-5">

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
                  placeholder="Enter username"
                  autoComplete="username"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-lg
                    bg-white/95
                    text-gray-900
                    outline-none
                    focus:ring-2
                    focus:ring-blue-400
                    shadow-lg
                  "
                />

              </div>


              {/* PASSWORD */}

              <div className="mb-3">

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
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-lg
                    bg-white/95
                    text-gray-900
                    outline-none
                    focus:ring-2
                    focus:ring-blue-400
                    shadow-lg
                  "
                />

              </div>


              {/* FORGOT */}

              <div className="text-right mb-6">

                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setError("");
                    setSuccess("");
                  }}
                  className="
                    text-white
                    font-semibold
                    underline
                    hover:text-blue-200
                  "
                >
                  Forgot Password?
                </button>

              </div>


              {/* LOGIN */}

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  py-3
                  rounded-lg
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:bg-blue-400
                  text-white
                  font-bold
                  text-lg
                  shadow-xl
                  transition
                "
              >

                {loading
                  ? "Logging in..."
                  : `Login as ${loginType}`}

              </button>


              {/* BACK */}

              <button
                type="button"
                onClick={backToLoginSelection}
                className="
                  w-full
                  mt-3
                  py-2
                  text-white
                  font-semibold
                  hover:text-blue-200
                "
              >
                ← Back
              </button>

            </form>
          )}


          {/* =====================================================
              3. FORGOT PASSWORD
          ===================================================== */}

          {showForgot && (

            <div className="
              bg-black/40
              backdrop-blur-sm
              rounded-2xl
              p-6
            ">

              <h2 className="
                text-2xl
                font-bold
                text-white
                text-center
                mb-6
              ">
                Forgot Password
              </h2>


              {/* ERROR */}

              {error && (
                <div className="
                  mb-4
                  bg-red-500/90
                  text-white
                  px-4
                  py-3
                  rounded-lg
                  text-center
                  text-sm
                ">
                  {error}
                </div>
              )}


              {/* SUCCESS */}

              {success && (
                <div className="
                  mb-4
                  bg-green-500/90
                  text-white
                  px-4
                  py-3
                  rounded-lg
                  text-center
                  text-sm
                ">
                  {success}
                </div>
              )}


              {/* EMAIL */}

              <div className="mb-4">

                <label className="block text-white font-semibold mb-2">
                  Enter Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter registered email"
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-lg
                    bg-white/95
                    text-gray-900
                    outline-none
                    focus:ring-2
                    focus:ring-blue-400
                  "
                />

              </div>


              {/* SEND OTP */}

              {!otpSent && (

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="
                    w-full
                    py-3
                    rounded-lg
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:bg-blue-400
                    text-white
                    font-bold
                    shadow-lg
                  "
                >

                  {loading
                    ? "Sending OTP..."
                    : "Send OTP"}

                </button>
              )}


              {/* OTP + PASSWORD */}

              {otpSent && (

                <>

                  {/* OTP */}

                  <div className="mb-4">

                    <label className="block text-white font-semibold mb-2">
                      Enter OTP
                    </label>

                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => {

                        setOtp(
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        );

                        setError("");
                      }}
                      placeholder="Enter 6-digit OTP"
                      className="
                        w-full
                        px-4
                        py-3
                        rounded-lg
                        bg-white/95
                        text-gray-900
                        outline-none
                        text-center
                        tracking-widest
                        text-xl
                      "
                    />

                  </div>


                  {/* NEW PASSWORD */}

                  <div className="mb-4">

                    <label className="block text-white font-semibold mb-2">
                      New Password
                    </label>

                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(
                          e.target.value
                        );
                        setError("");
                      }}
                      placeholder="Enter new password"
                      className="
                        w-full
                        px-4
                        py-3
                        rounded-lg
                        bg-white/95
                        text-gray-900
                        outline-none
                      "
                    />

                  </div>


                  {/* CONFIRM PASSWORD */}

                  <div className="mb-6">

                    <label className="block text-white font-semibold mb-2">
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(
                          e.target.value
                        );
                        setError("");
                      }}
                      placeholder="Confirm new password"
                      className="
                        w-full
                        px-4
                        py-3
                        rounded-lg
                        bg-white/95
                        text-gray-900
                        outline-none
                      "
                    />

                  </div>


                  {/* RESET */}

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="
                      w-full
                      py-3
                      rounded-lg
                      bg-blue-600
                      hover:bg-blue-700
                      disabled:bg-blue-400
                      text-white
                      font-bold
                      shadow-lg
                    "
                  >

                    {loading
                      ? "Resetting..."
                      : "Password Reset"}

                  </button>

                </>
              )}


              {/* BACK TO LOGIN */}

              <button
                type="button"
                onClick={backFromForgot}
                className="
                  w-full
                  mt-3
                  py-2
                  text-white
                  hover:text-blue-200
                  font-semibold
                "
              >
                ← Back to Login
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Login;