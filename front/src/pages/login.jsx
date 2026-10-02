import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../config/api";
import styles from "../styles/loginStyles";

function Login() {
  const navigate = useNavigate();

  
  const [loginType, setLoginType] = useState("admin");

  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  
  const adminLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/admin/adminLogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Admin login failed");
        return;
      }

      if (!data.accessToken) {
        setError("No access token received");
        return;
      }

      
      localStorage.setItem("accessToken", data.accessToken);

      
      localStorage.setItem("userRole", "ADMIN");

      navigate("/admin-events");

    } catch (error) {
      setError("Backend server is not running");
    } finally {
      setLoading(false);
    }
  };


  const sendOtp = async () => {
    setError("");

    if (!phone) {
      setError("Please enter phone number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/user/userLogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "OTP sending failed");
        return;
      }

      setOtp("");
      setOtpSent(true);

    } catch (error) {
      setError("Backend server is not running");
    } finally {
      setLoading(false);
    }
  };

  
  const verifyOtp = async () => {
    setError("");

    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/user/accesstoken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid OTP");
        return;
      }

      if (!data.accessToken) {
        setError("No access token received");
        return;
      }

    
      localStorage.setItem("accessToken", data.accessToken);

  
      localStorage.setItem("userRole", "STAFF");

      navigate("/sell-ticket");

    } catch (error) {
      setError("Backend server is not running");
    } finally {
      setLoading(false);
    }
  };

  
  const handleLogin = () => {
    if (loginType === "admin") {
      adminLogin();
    } else {
      if (otpSent) {
        verifyOtp();
      } else {
        sendOtp();
      }
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logo}>
          OS
        </div>

        <h1 style={styles.title}>
          On-Ground Sales
        </h1>

        <p style={styles.subtitle}>
          Login to continue
        </p>

      

        <div style={styles.tabs}>

          <button
            type="button"
            onClick={() => {
              setLoginType("admin");
              setOtpSent(false);
              setOtp("");
              setError("");
            }}
            style={{
              ...styles.tab,
              ...(loginType === "admin"
                ? styles.activeTab
                : {}),
            }}
          >
            Admin
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType("staff");
              setOtpSent(false);
              setOtp("");
              setError("");
            }}
            style={{
              ...styles.tab,
              ...(loginType === "staff"
                ? styles.activeTab
                : {}),
            }}
          >
            Staff
          </button>

        </div>

      

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

  

        {loginType === "admin" ? (
          <>
            <label style={styles.label}>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </>
        ) : (



          <>
            <label style={styles.label}>
              Phone Number
            </label>

            <input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
            />

            {otpSent && (
              <>
                <label style={styles.label}>
                  OTP
                </label>

                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={styles.input}
                  maxLength={6}
                />
              </>
            )}
          </>
        )}

      

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={styles.loginButton}
        >
          {loading
            ? "Please wait..."
            : loginType === "admin"
            ? "Login"
            : otpSent
            ? "Verify OTP"
            : "Send OTP"}
        </button>

  

        {loginType === "staff" && otpSent && (
          <button
            type="button"
            onClick={sendOtp}
            disabled={loading}
            style={styles.resendButton}
          >
            Resend OTP
          </button>
        )}

      </div>
    </div>
  );
}

export default Login;