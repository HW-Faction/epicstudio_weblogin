import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";


export default function Login() {
  const authData = useAuth();

  if (!authData) return null;

  const { user } = authData;

  useEffect(() => {
    if (user) {
        navigate("/dashboard");
    }
  }, [user]);

  const navigate = useNavigate();

  const [isClientLogin, setIsClientLogin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 EMAIL LOGIN
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  // 🔥 SETUP RECAPTCHA
  const setupRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      { size: "invisible" },
      auth
    );
  };

  // 🔥 SEND OTP
  const handleSendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      setupRecaptcha();

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  // 🔥 VERIFY OTP
  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);

    try {
      await confirmationResult.confirm(otp);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid OTP");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-primary">
            EpicStudio
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage your projects efficiently
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="text-red-500 text-sm mb-3">{error}</div>
        )}

        {/* EMAIL LOGIN */}
        {!isClientLogin && (
          <form onSubmit={handleEmailLogin} className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg"
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>
        )}

        {/* CLIENT LOGIN (PHONE OTP) */}
        {isClientLogin && (
          <div className="space-y-4">

            {!confirmationResult ? (
              <>
                <input
                  type="text"
                  placeholder="+91XXXXXXXXXX"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <button
                  onClick={handleSendOtp}
                  className="w-full bg-primary text-white py-2 rounded-lg"
                >
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <button
                  onClick={handleVerifyOtp}
                  className="w-full bg-primary text-white py-2 rounded-lg"
                >
                  Verify OTP
                </button>
              </>
            )}

            {/* Recaptcha container */}
            <div id="recaptcha-container"></div>
          </div>
        )}

        {/* TOGGLE */}
        <div className="text-center mt-4 text-sm">
          <button
            onClick={() => {
              setIsClientLogin(!isClientLogin);
              setError("");
            }}
            className="text-primary font-semibold"
          >
            {isClientLogin
              ? "Back to Employee Login"
              : "Client login? Click here"}
          </button>
        </div>

      </div>
    </div>
  );
}