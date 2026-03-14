// userController.js
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const nodemailer = require("nodemailer");
dotenv.config();
const { resetPasswordTemplate } = require("../service/emailTemplate");
const logError = require("../service/service");

function generateTempPassword(length = 6) {
  const chars = "1234567890";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// REGISTER
const Register = async (req, res) => {
  try {
    const { UserName, Password, Email, Role } = req.body;
    if (!UserName || !Password || !Email || !Role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // check duplicates
    const [exist] = await db.query(
      "SELECT UserId FROM tbluser WHERE UserName = ? OR Email = ?",
      [UserName, Email]
    );
    if (exist.length > 0) {
      return res.status(409).json({ message: "Username or Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    await db.query(
      "INSERT INTO tbluser (UserName, Password, Email, Role, Status) VALUES (?, ?, ?, ?, 'Active')",
      [UserName, hashedPassword, Email, Role]
    );

    res.status(201).json({ message: "Register success" });
  } catch (error) {
    logError("User", error, res);
  }
};

// LOGIN
const Login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Missing username/email or password" });
    }

    const [rows] = await db.query(
      "SELECT * FROM tbluser WHERE (UserName = ? OR Email = ? ) AND Status = 'Active' LIMIT 1",
      [username.trim(), username.trim()]
    );

    if (rows.length === 0) return res.status(401).json({ message: "User not found" });

    const user = rows[0];

    // check temp password expire
    if (user.ResetPasswordExpire && new Date() > new Date(user.ResetPasswordExpire)) {
      return res.status(401).json({ message: "Temporary password expired" });
    }

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      {
        UserId: user.UserId,
        UserName: user.UserName,
        role: user.Role,
        status: user.Status
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: "Login success",
      token,
      user: {
        UserId: user.UserId,
        UserName: user.UserName,
        Email: user.Email,
        Role: user.Role,
      },
      forceChangePassword: user.is_temp_password === 1
    });
  } catch (error) {
    logError("User", error, res);
  }
};

// FORGOT PASSWORD
const ForgotPassword = async (req, res) => {
  try {
    const { Email } = req.body;
    if (!Email) return res.status(400).json({ message: "Email required" });

    const [rows] = await db.query(
      "SELECT UserId, UserName, Email FROM tbluser WHERE Email = ?",
      [Email.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    const user = rows[0];
    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);

    await db.query(
      "UPDATE tbluser SET Password = ?, is_temp_password = 1 WHERE UserId = ?",
      [hashed, user.UserId]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.Email,
      subject: "Password Reset",
      html: resetPasswordTemplate(user.UserName, tempPassword),
    });

    res.json({ message: "Temporary password sent to email" });
  } catch (error) {
    logError("User", error, res);
  }
};

// GET USER LIST
const GetList = async (req, res) => {
  try {
    const SQL = `
      SELECT UserId, UserName, Email, Role, Status, CreatedAt
      FROM tbluser
    `;
    const [rows] = await db.query(SQL);
    res.json({ message: "Get user success", list: rows });
  } catch (error) {
    logError("User", error, res);
  }
};

// CREATE USER (Admin)
const Create = async (req, res) => {
  try {
    const { UserName, Password, Email, Role } = req.body;

    if (!UserName || !Password || !Email || !Role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const SQL = `
      INSERT INTO tbluser (UserName, Password, Email, Role, Status)
      VALUES (?, ?, ?, ?, 'Active')
    `;

    await db.query(SQL, [UserName, hashedPassword, Email, Role]);

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    logError("User", error, res);
  }
};

// UPDATE USER
const Update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Use exact same case as frontend
    const { UserName, Password, Email, Role, Status } = req.body;

    if (!UserName || !Email || !Role || !Status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const hashedPassword = Password ? await bcrypt.hash(Password, 10) : null;

    const SQL = `
      UPDATE tbluser
      SET
        UserName = ?,
        Password = COALESCE(?, Password),
        Email = ?,
        \`Role\` = ?,
        Status = ?
      WHERE UserId = ?
    `;
    const [result] = await db.query(SQL, [UserName, hashedPassword, Email, Role, Status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found or no changes" });
    }

    res.json({ message: "User updated success", updated: result.affectedRows });
  } catch (error) {
    logError("User", error, res);
  }
};

// DELETE USER
const Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const SQL = "DELETE FROM tbluser WHERE UserId = ?";
    const [result] = await db.query(SQL, [id]);
    res.json({ message: "User deleted success", deleted: result.affectedRows });
  } catch (error) {
    logError("User", error, res);
  }
};

// sendOTP
const sendOTP = async (req, res) => {
  try {
    const { Email } = req.body;

    if (!Email || typeof Email !== "string" || !Email.trim()) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const emailTrim = Email.trim().toLowerCase();

    const [rows] = await db.query(
      "SELECT UserId, UserName, Email FROM tbluser WHERE LOWER(Email) = ? LIMIT 1",
      [emailTrim]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = rows[0];
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      "UPDATE tbluser SET otp_code = ?, otp_expires_at = ? WHERE UserId = ?",
      [otp, expiresAt, user.UserId]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.Email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log("sendOTP error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// verifyOTP
const verifyOTP = async (req, res) => {
  try {
    const { Email, otp } = req.body;

    if (!Email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP required",
      });
    }

    const emailTrim = Email.trim().toLowerCase();

    const [rows] = await db.query(
      "SELECT UserId, Email, otp_code, otp_expires_at FROM tbluser WHERE LOWER(Email) = ? LIMIT 1",
      [emailTrim]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = rows[0];

    if (!user.otp_code || !user.otp_expires_at) {
      return res.status(400).json({
        success: false,
        error: "OTP not requested",
      });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({
        success: false,
        error: "OTP expired",
      });
    }

    if (String(user.otp_code) !== String(otp)) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log("verifyOTP error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// resetPassword
const resetPassword = async (req, res) => {
  try {
    const { Email, otp, newPassword } = req.body;

    if (!Email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Missing fields",
      });
    }

    const emailTrim = Email.trim().toLowerCase();

    const [rows] = await db.query(
      "SELECT UserId, Email, otp_code, otp_expires_at FROM tbluser WHERE LOWER(Email) = ? LIMIT 1",
      [emailTrim]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = rows[0];

    if (!user.otp_code || !user.otp_expires_at) {
      return res.status(400).json({
        success: false,
        error: "OTP not requested",
      });
    }

    if (String(user.otp_code) !== String(otp)) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({
        success: false,
        error: "OTP expired",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE tbluser
       SET Password = ?, otp_code = NULL, otp_expires_at = NULL, is_temp_password = 0
       WHERE UserId = ?`,
      [hashedPassword, user.UserId]
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("resetPassword error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// RESET PASSWORD BY ADMIN
const ResetPasswordByAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const tempPassword = generateTempPassword(); // e.g. Ab3#X9pQ
    const hashed = await bcrypt.hash(tempPassword, 10);

    const [result] = await db.query(
      `UPDATE tbluser
       SET Password = ?, is_temp_password = 1
       WHERE UserId = ?`,
      [hashed, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Password reset success",
      tempPassword, // ⚠️ បង្ហាញតែ ១ ដង
    });

  } catch (error) {
    logError("User", error, res);
  }
};

const ChangePassword = async (req, res) => {
  try {
    const userId = req.user.UserId;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 3) {
      return res.status(400).json({ message: "Password ត្រូវ >= 3 តួ" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Password មិនដូចគ្នា" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE tbluser SET Password = ?, is_temp_password = 0 WHERE UserId = ?",
      [hashed, userId]
    );

    res.json({ message: "Change password success" });
  } catch (error) {
    logError("User", error, res);
  }
};



module.exports = {
  Register,
  Login,
  ForgotPassword,
  GetList,
  Create,
  Update,
  Delete,
  sendOTP,
  verifyOTP,
  resetPassword,
  ResetPasswordByAdmin,
  ChangePassword,
};
