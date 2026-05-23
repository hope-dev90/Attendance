const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const transporter = require('../config/mailer');

const generateTokens = (rep) => {
  const payload = {
    id: rep.id,
    email: rep.email,
    classId: rep.class_id,
    class_id: rep.class_id,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '155m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, fullName, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { sent: false, error: 'Email credentials are not configured.' };
  }

  try {
    await transporter.sendMail({
      from: `Class Rep System <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem;border:1px solid #e2e8f0;border-radius:8px;">
        <h2 style="color:#2563eb;">Verify your account</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>Use the code below to verify your Class Rep account. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.5rem;text-align:center;padding:1.5rem;background:#f1f5f9;border-radius:8px;margin:1.5rem 0;">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:0.875rem;">If you didn't create this account, ignore this email.</p>
      </div>
    `,
    });

    return { sent: true };
  } catch (err) {
    console.error('OTP email error:', err.message);
    return { sent: false, error: err.message };
  }
};

const buildOtpResponse = ({
  message,
  email,
  otp,
  mailStatus,
  statusCode = 200,
}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const response = {
    message: mailStatus.sent
      ? message
      : `${message} Email delivery failed, so use the development OTP shown here.`,
    email,
  };

  if (!mailStatus.sent && !isProduction) {
    response.devOtp = otp;
    response.mailError = mailStatus.error;
  }

  return { statusCode, response };
};

const signup = async (req, res) => {
  const { full_name, email, password, class_id } = req.body;

  if (!full_name || !email || !password || !class_id) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const existing = await pool.query(
      'SELECT id, is_verified FROM reps WHERE email = $1',
      [email],
    );
    if (existing.rows.length > 0) {
      if (existing.rows[0].is_verified) {
        return res.status(409).json({ message: 'Email already registered.' });
      }
      // Unverified — resend OTP
      const otp = generateOTP();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await pool.query(
        'UPDATE reps SET otp_code = $1, otp_expires_at = $2 WHERE email = $3',
        [otp, expires, email],
      );
      const mailStatus = await sendOTPEmail(
        email,
        existing.rows[0].full_name || full_name,
        otp,
      );
      const { statusCode, response } = buildOtpResponse({
        message: 'OTP resent. Please verify your email.',
        email,
        otp,
        mailStatus,
      });
      return res.status(statusCode).json(response);
    }

    const classCheck = await pool.query(
      'SELECT id FROM classes WHERE id = $1',
      [class_id],
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    const repCheck = await pool.query(
      'SELECT id FROM reps WHERE class_id = $1 AND is_verified = TRUE',
      [class_id],
    );
    if (repCheck.rows.length > 0) {
      return res
        .status(409)
        .json({ message: 'This class already has a representative.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO reps (full_name, email, password_hash, class_id, otp_code, otp_expires_at, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE)`,
      [full_name, email, password_hash, class_id, otp, expires],
    );

    const mailStatus = await sendOTPEmail(email, full_name, otp);
    const { statusCode, response } = buildOtpResponse({
      message: 'Account created. Check your email for the verification code.',
      email,
      otp,
      mailStatus,
      statusCode: 201,
    });

    return res.status(statusCode).json(response);
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM reps WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const rep = result.rows[0];

    if (rep.is_verified) {
      return res.status(400).json({ message: 'Account already verified.' });
    }

    if (rep.otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (new Date() > new Date(rep.otp_expires_at)) {
      return res
        .status(400)
        .json({
          message: 'Verification code has expired. Please sign up again.',
        });
    }

    await pool.query(
      'UPDATE reps SET is_verified = TRUE, is_active = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [rep.id],
    );

    const { accessToken, refreshToken } = generateTokens(rep);
    await pool.query('UPDATE reps SET refresh_token = $1 WHERE id = $2', [
      refreshToken,
      rep.id,
    ]);

    return res.json({
      message: 'Email verified successfully.',
      accessToken,
      refreshToken,
      rep: {
        id: rep.id,
        full_name: rep.full_name,
        email: rep.email,
        class_id: rep.class_id,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required.' });

  try {
    const result = await pool.query('SELECT * FROM reps WHERE email = $1', [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Account not found.' });

    const rep = result.rows[0];
    if (rep.is_verified)
      return res.status(400).json({ message: 'Account already verified.' });

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'UPDATE reps SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
      [otp, expires, rep.id],
    );

    const mailStatus = await sendOTPEmail(email, rep.full_name, otp);
    const { statusCode, response } = buildOtpResponse({
      message: 'New OTP sent.',
      email,
      otp,
      mailStatus,
    });
    return res.status(statusCode).json(response);
  } catch (err) {
    console.error('Resend OTP error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM reps WHERE email = $1 AND is_verified = TRUE',
      [email],
    );

    if (result.rows.length === 0) {
      // Check if account exists but unverified
      const unverified = await pool.query(
        'SELECT email FROM reps WHERE email = $1',
        [email],
      );
      if (unverified.rows.length > 0) {
        return res.status(403).json({
          message: 'Please verify your email before logging in.',
          email,
        });
      }
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const rep = result.rows[0];

    const valid = await bcrypt.compare(password, rep.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const { accessToken, refreshToken } = generateTokens(rep);
    await pool.query('UPDATE reps SET refresh_token = $1 WHERE id = $2', [
      refreshToken,
      rep.id,
    ]);

    return res.json({
      accessToken,
      refreshToken,
      rep: {
        id: rep.id,
        full_name: rep.full_name,
        email: rep.email,
        class_id: rep.class_id,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res
      .status(500)
      .json({ message: 'Server error.', detail: err.message });
  }
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: 'Refresh token required.' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const result = await pool.query(
      'SELECT * FROM reps WHERE id = $1 AND refresh_token = $2 AND is_active = TRUE',
      [decoded.id, refreshToken],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const rep = result.rows[0];
    const tokens = generateTokens(rep);

    await pool.query('UPDATE reps SET refresh_token = $1 WHERE id = $2', [
      tokens.refreshToken,
      rep.id,
    ]);

    return res.json(tokens);
  } catch (err) {
    return res
      .status(401)
      .json({ message: 'Invalid or expired refresh token.' });
  }
};

const logout = async (req, res) => {
  try {
    await pool.query('UPDATE reps SET refresh_token = NULL WHERE id = $1', [
      req.rep.id,
    ]);
    return res.json({ message: 'Logged out.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

const me = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.full_name, r.email, r.class_id, r.profile_pic, c.name AS class_name
       FROM reps r
       LEFT JOIN classes c ON c.id = r.class_id
       WHERE r.id = $1`,
      [req.rep.id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Rep not found.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      position,
      department,
      address,
      profilePic,
    } = req.body;

    const result = await pool.query(
      `UPDATE reps 
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           profile_pic = COALESCE($3, profile_pic)
       WHERE id = $4
       RETURNING id, full_name, email, class_id, profile_pic`,
      [full_name, email, profilePic, req.rep.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rep not found.' });
    }

    return res.json({
      message: 'Profile updated successfully.',
      rep: result.rows[0],
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  signup,
  verifyOTP,
  resendOTP,
  login,
  refresh,
  logout,
  me,
  updateProfile,
};
