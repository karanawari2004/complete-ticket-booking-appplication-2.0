
const { randomInt } = require("crypto");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const User = require("../models/User");
const sendOTP = require("../config/twilio");

const normalizeIndianPhone = (value) => {
  if (value === undefined || value === null) return null;

  const phone = String(value)
    .trim()
    .replace(/[\s()-]/g, "");

  if (/^[6-9]\d{9}$/.test(phone)) {
    return `+91${phone}`;
  }

  if (/^\+91[6-9]\d{9}$/.test(phone)) {
    return phone;
  }

  return null;
};

const createAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    process.env.JWT_SECRET || "my_secret_key",
    {
      expiresIn: "24h",
    }
  );
};

// =========================
// ADMIN LOGIN
// =========================

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
    });

    if (!admin || password !== admin.password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = createAccessToken(admin);

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role || "ADMIN",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// SEND OTP
// =========================

const sendOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({
        message: "Enter a valid Indian 10-digit phone number",
      });
    }

    console.info(
      "Sending OTP to phone ending in",
      phone.slice(-4)
    );

    // Find existing staff user
    let user = await User.findOne({ phone });

    // Create staff user if not exists
    if (!user) {
      user = await User.create({
        phone,
        role: "STAFF",
      });
    }

    // Generate a DIFFERENT 6-digit OTP
    const otp = randomInt(100000, 1000000).toString();

    // Save generated OTP in database
    user.otp = otp;

    // OTP valid for 30 minutes
    user.otpExpiresAt = new Date(
      Date.now() + 30 * 60 * 1000
    );

    await user.save();

    // Show OTP in development console only
    if (process.env.NODE_ENV !== "production") {
      console.info("[OTP] Development code:", otp);
      console.info("[OTP] Backup development code: 461933");
    }

    // Try to send OTP through Twilio
    try {
      await sendOTP(phone, otp);

      console.log("OTP sent successfully");
    } catch (twilioError) {
      console.error(
        "Twilio OTP sending failed:",
        twilioError.message
      );

      // In production, Twilio failure should stop login flow
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({
          message: "Failed to send OTP",
        });
      }

      // In development, continue and allow backup OTP
      console.log(
        "Development mode: backup OTP 461933 can be used"
      );
    }

    res.json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    res.status(500).json({
      message: error.message || "Failed to send OTP",
    });
  }
};

// =========================
// VERIFY OTP
// =========================

const verifyOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);

    let { otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        message:
          "A valid Indian phone number and OTP are required",
      });
    }

    otp = otp.toString().trim();

    // Find staff user
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ========================================
    // DEVELOPMENT BACKUP OTP
    // ========================================

    const isDevelopmentBackupOtp =
      process.env.NODE_ENV !== "production" &&
      otp === "461933";

    // ========================================
    // NORMAL OTP VERIFICATION
    // ========================================

    if (!isDevelopmentBackupOtp) {
      if (!user.otp) {
        return res.status(400).json({
          message: "OTP not found",
        });
      }

      if (!user.otpExpiresAt) {
        return res.status(400).json({
          message: "OTP expiry not found",
        });
      }

      // Check OTP expiry
      if (new Date() > user.otpExpiresAt) {
        return res.status(400).json({
          message: "OTP expired",
        });
      }

      // Check normal OTP
      if (user.otp !== otp) {
        return res.status(400).json({
          message: "Invalid OTP",
        });
      }

      console.log("SMS OTP verified successfully");
    }

    // ========================================
    // BACKUP OTP SUCCESS
    // ========================================

    if (isDevelopmentBackupOtp) {
      console.log(
        "Development backup OTP 461933 verified successfully"
      );
    }

    // ========================================
    // CREATE JWT
    // ========================================

    const accessToken = createAccessToken(user);

    // ========================================
    // REMOVE OTP AFTER SUCCESSFUL LOGIN
    // ========================================

    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    // ========================================
    // LOGIN RESPONSE
    // ========================================

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role || "STAFF",
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// LOGOUT
// =========================

const logout = (req, res) => {
  res.json({
    message: "Logout successful",
  });
};

// =========================
// EXPORT
// =========================

module.exports = {
  adminLogin,
  sendOtp,
  verifyOtp,
  logout,
};
