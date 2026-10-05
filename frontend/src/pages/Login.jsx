import React, { useState } from "react";
import backgroundVideo from "../assets/Background video.mp4";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function Login({ onLogin, onRegister, onForgotPassword }) {

  // =========================
  // LOGIN STATES
  // =========================

  const [loginType, setLoginType] = useState("Admin");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);


  // =========================
  // FORGOT PASSWORD STATES
  // =========================

  const [showForgot, setShowForgot] = useState(false);

  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  const [otpSent, setOtpSent] = useState(false);

  const [forgotError, setForgotError] = useState("");

  const [forgotSuccess, setForgotSuccess] = useState("");

  const [forgotLoading, setForgotLoading] =
    useState(false);


  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e) => {

    e.preventDefault();

    setLoginError("");

    if (!username.trim()) {
      setLoginError("Please enter your username.");
      return;
    }

    if (!password) {
      setLoginError("Please enter your password.");
      return;
    }

    setLoginLoading(true);

    try {

      const response = await fetch(
        `${API_URL}/api/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: username.trim(),
            password: password,
            expected_role: loginType,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        setLoginError(
          data.message ||
          "Invalid username or password."
        );

        return;
      }


      if (!data.success) {

        setLoginError(
          data.message ||
          "Login failed."
        );

        return;
      }


      // Login success

      if (onLogin) {
        onLogin(data.user);
      }

    } catch (error) {

      console.error("LOGIN ERROR:", error);

      setLoginError(
        "Unable to connect to server. Please start Flask."
      );

    } finally {

      setLoginLoading(false);

    }
  };


  // =====================================================
  // OPEN FORGOT PASSWORD
  // =====================================================

  const openForgotPassword = () => {

    setShowForgot(true);

    setLoginError("");

    setForgotError("");

    setForgotSuccess("");

    setEmail("");

    setOtp("");

    setNewPassword("");

    setConfirmNewPassword("");

    setOtpSent(false);
  };


  // =====================================================
  // BACK TO LOGIN
  // =====================================================

  const backToLogin = () => {

    setShowForgot(false);

    setLoginError("");

    setForgotError("");

    setForgotSuccess("");

    setEmail("");

    setOtp("");

    setNewPassword("");

    setConfirmNewPassword("");

    setOtpSent(false);
  };


  // =====================================================
  // SEND OTP
  // =====================================================

  const handleSendOTP = async (e) => {

    e.preventDefault();

    setForgotError("");

    setForgotSuccess("");


    if (!email.trim()) {

      setForgotError(
        "Please enter your email address."
      );

      return;
    }


    setForgotLoading(true);


    try {

      const response = await fetch(
        `${API_URL}/api/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        setForgotError(
          data.message ||
          "Unable to send OTP."
        );

        return;
      }


      if (!data.success) {

        setForgotError(
          data.message ||
          "Unable to send OTP."
        );

        return;
      }


      setOtpSent(true);


      // Demo OTP support

      if (data.demo_otp) {

        setForgotSuccess(
          `OTP generated successfully. Demo OTP: ${data.demo_otp}`
        );

      } else {

        setForgotSuccess(
          data.message ||
          "OTP sent successfully to your email."
        );

      }

    } catch (error) {

      console.error(
        "SEND OTP ERROR:",
        error
      );

      setForgotError(
        "Unable to connect to server. Please start Flask."
      );

    } finally {

      setForgotLoading(false);

    }
  };


  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOTP = async (e) => {

    e.preventDefault();

    setForgotError("");

    setForgotSuccess("");


    if (!otp.trim()) {

      setForgotError(
        "Please enter the OTP."
      );

      return;
    }


    if (otp.trim().length !== 6) {

      setForgotError(
        "OTP must contain 6 digits."
      );

      return;
    }


    setForgotLoading(true);


    try {

      const response = await fetch(
        `${API_URL}/api/verify-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        setForgotError(
          data.message ||
          "Invalid OTP."
        );

        return;
      }


      if (!data.success) {

        setForgotError(
          data.message ||
          "OTP verification failed."
        );

        return;
      }


      setForgotSuccess(
        "OTP verified successfully. Create your new password."
      );

    } catch (error) {

      console.error(
        "VERIFY OTP ERROR:",
        error
      );

      setForgotError(
        "Unable to connect to server."
      );

    } finally {

      setForgotLoading(false);

    }
  };


  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (e) => {

    e.preventDefault();

    setForgotError("");

    setForgotSuccess("");


    if (!newPassword) {

      setForgotError(
        "Please enter a new password."
      );

      return;
    }


    if (newPassword.length < 6) {

      setForgotError(
        "Password must contain at least 6 characters."
      );

      return;
    }


    if (
      newPassword !==
      confirmNewPassword
    ) {

      setForgotError(
        "Passwords do not match."
      );

      return;
    }


    setForgotLoading(true);


    try {

      const response = await fetch(
        `${API_URL}/api/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
            new_password: newPassword,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        setForgotError(
          data.message ||
          "Unable to reset password."
        );

        return;
      }


      if (!data.success) {

        setForgotError(
          data.message ||
          "Unable to reset password."
        );

        return;
      }


      setForgotSuccess(
        "Password reset successfully! You can login now."
      );


      setTimeout(() => {

        backToLogin();

      }, 2000);


    } catch (error) {

      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      setForgotError(
        "Unable to connect to server."
      );

    } finally {

      setForgotLoading(false);

    }
  };


  // =====================================================
  // FORGOT PASSWORD PAGE
  // =====================================================

  if (showForgot) {

    return (

      <div className="relative min-h-screen overflow-hidden">

        {/* BACKGROUND VIDEO */}

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
            bg-black/60
            backdrop-blur-[2px]
            -z-10
          "
        />


        {/* MAIN */}

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
                "
              >
                Smart Hospital
              </h1>


              <p
                className="
                  text-white/80
                  mt-1
                "
              >
                Hospital Management System
              </p>

            </div>


            {/* FORGOT CARD */}

            <div
              className="
                bg-black/50
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

              {forgotError && (

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
                  {forgotError}
                </div>

              )}


              {/* SUCCESS */}

              {forgotSuccess && (

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
                  {forgotSuccess}
                </div>

              )}


              {/* EMAIL */}

              <div className="mb-5">

                <label
                  className="
                    block
                    text-white
                    font-semibold
                    mb-2
                  "
                >
                  Enter Email
                </label>


                <input
                  type="email"
                  value={email}
                  onChange={(e) => {

                    setEmail(e.target.value);

                    setForgotError("");

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
                  "
                  disabled={otpSent}
                />

              </div>


              {/* SEND OTP */}

              {!otpSent && (

                <form onSubmit={handleSendOTP}>

                  <button
                    type="submit"
                    disabled={forgotLoading}
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
                    "
                  >

                    {forgotLoading
                      ? "Sending OTP..."
                      : "Send OTP"}

                  </button>

                </form>

              )}


              {/* OTP + PASSWORD */}

              {otpSent && (

                <div>

                  {/* OTP */}

                  <div className="mb-4">

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

                        const value =
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);

                        setOtp(value);

                        setForgotError("");

                      }}
                      placeholder="Enter 6 digit OTP"
                      className="
                        w-full
                        px-4
                        py-3
                        rounded-xl
                        bg-white
                        text-gray-900
                        outline-none
                      "
                    />

                  </div>


                  {/* VERIFY OTP */}

                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={forgotLoading}
                    className="
                      w-full
                      py-3
                      rounded-xl
                      bg-green-600
                      hover:bg-green-700
                      disabled:bg-green-400
                      text-white
                      font-bold
                      mb-5
                    "
                  >

                    {forgotLoading
                      ? "Verifying..."
                      : "Verify OTP"}

                  </button>


                  {/* NEW PASSWORD */}

                  <div className="mb-4">

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

                        setNewPassword(
                          e.target.value
                        );

                        setForgotError("");

                      }}
                      placeholder="Create new password"
                      className="
                        w-full
                        px-4
                        py-3
                        rounded-xl
                        bg-white
                        text-gray-900
                        outline-none
                      "
                    />

                  </div>


                  {/* CONFIRM PASSWORD */}

                  <div className="mb-5">

                    <label
                      className="
                        block
                        text-white
                        font-semibold
                        mb-2
                      "
                    >
                      Confirm New Password
                    </label>


                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => {

                        setConfirmNewPassword(
                          e.target.value
                        );

                        setForgotError("");

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
                      "
                    />

                  </div>


                  {/* RESET PASSWORD */}

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={forgotLoading}
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
                    "
                  >

                    {forgotLoading
                      ? "Resetting Password..."
                      : "Reset Password"}

                  </button>

                </div>

              )}


              {/* BACK */}

              <button
                type="button"
                onClick={backToLogin}
                className="
                  w-full
                  mt-5
                  text-white
                  font-semibold
                  hover:text-blue-200
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


  // =====================================================
  // NORMAL LOGIN PAGE
  // =====================================================

  return (

    <div className="relative min-h-screen overflow-hidden">


      {/* BACKGROUND VIDEO */}

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


      {/* OVERLAY */}

      <div
        className="
          fixed
          inset-0
          bg-black/60
          backdrop-blur-[2px]
          -z-10
        "
      />


      {/* MAIN */}

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
              "
            >
              Smart Hospital
            </h1>


            <p
              className="
                text-white/80
                mt-1
              "
            >
              Hospital Management System
            </p>

          </div>


          {/* LOGIN CARD */}

          <div
            className="
              bg-black/50
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
              Login
            </h2>


            {/* ERROR */}

            {loginError && (

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
                {loginError}
              </div>

            )}


            {/* LOGIN TYPE */}

            <div className="mb-5">

              <label
                className="
                  block
                  text-white
                  font-semibold
                  mb-2
                "
              >
                Login As
              </label>


              <select
                value={loginType}
                onChange={(e) => {

                  setLoginType(e.target.value);

                  setLoginError("");

                }}
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
                "
              >

                <option value="Admin">
                  Admin
                </option>

                <option value="Doctor">
                  Doctor
                </option>

              </select>

            </div>


            {/* USERNAME */}

            <div className="mb-5">

              <label
                className="
                  block
                  text-white
                  font-semibold
                  mb-2
                "
              >
                Username
              </label>


              <input
                type="text"
                value={username}
                onChange={(e) => {

                  setUsername(e.target.value);

                  setLoginError("");

                }}
                placeholder="Enter your username"
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  bg-white
                  text-gray-900
                  placeholder-gray-500
                  outline-none
                  border-2
                  border-transparent
                  focus:border-blue-400
                "
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="mb-4">

              <label
                className="
                  block
                  text-white
                  font-semibold
                  mb-2
                "
              >
                Password
              </label>


              <input
                type="password"
                value={password}
                onChange={(e) => {

                  setPassword(e.target.value);

                  setLoginError("");

                }}
                placeholder="Enter your password"
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  bg-white
                  text-gray-900
                  placeholder-gray-500
                  outline-none
                  border-2
                  border-transparent
                  focus:border-blue-400
                "
                required
              />

            </div>


            {/* FORGOT */}

            <div className="text-right mb-5">

             <button
  type="button"
  onClick={onForgotPassword}
  className="
    w-full
    mt-4
    text-blue-200
    hover:text-white
    font-semibold
  "
>
  Forgot Password?
</button>

            </div>


            {/* LOGIN */}

            <form onSubmit={handleLogin}>

              <button
                type="submit"
                disabled={loginLoading}
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
                "
              >

                {loginLoading
                  ? "Logging in..."
                  : "Login"}

              </button>

            </form>


            {/* REGISTER */}

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


          </div>

        </div>

      </div>

    </div>

  );
}


export default Login;