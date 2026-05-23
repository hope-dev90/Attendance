const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const transporter = require('../config/mailer');

const LOGO_PATH = path.resolve(
  __dirname,
  '../../../attendance/attendance/src/assets/logo.jpg',
);

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
    const otpDigits = otp.split('');
    const firstName = fullName.split(' ')[0];

    const digitCell = (digit) => `
            <td width="46" height="56" align="center" valign="middle"
              style="width:46px;height:56px;background-color:#ffffff;border:1.5px solid #b8c9de;border-radius:12px;font-family:'SF Mono','Consolas','Courier New',monospace;font-size:26px;font-weight:700;color:#051d3b;line-height:56px;mso-line-height-rule:exactly;text-align:center;vertical-align:middle;">
              ${digit}
            </td>`;

    const digitGap = `
            <td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>`;

    const digitGroupGap = `
            <td width="20" align="center" valign="middle"
              style="width:20px;font-family:'DM Sans',Arial,sans-serif;font-size:22px;font-weight:600;color:#94a8c4;line-height:56px;text-align:center;vertical-align:middle;">
              &bull;
            </td>`;

    const otpDigitRow = otpDigits
      .map((digit, i) => {
        const cell = digitCell(digit);
        if (i === 2) return cell + digitGroupGap;
        if (i < otpDigits.length - 1) return cell + digitGap;
        return cell;
      })
      .join('');

    const hasLogo = fs.existsSync(LOGO_PATH);
    const logoHtml = hasLogo
      ? `<img src="cid:app-logo" alt="Attendance management" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:10px;object-fit:contain;background-color:#ffffff;" />`
      : `<span style="display:block;width:44px;height:44px;line-height:44px;text-align:center;font-size:18px;font-weight:700;color:#1a3b66;">A</span>`;

    await transporter.sendMail({
      from: `Attendance management System <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      attachments: hasLogo
        ? [{ filename: 'logo.jpg', path: LOGO_PATH, cid: 'app-logo' }]
        : [],
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your Attendance management account</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #eef2f7;
      font-family: 'DM Sans', Arial, sans-serif;
      padding: 48px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 520px;
      width: 100%;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #dce6f2;
    }
    .header {
      background: linear-gradient(135deg, #1a3b66 0%, #234a7a 100%);
      padding: 24px 28px;
    }
    .logo-name {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.2;
    }
    .logo-sub {
      font-size: 12px;
      color: #8fa7c7;
      margin-top: 1px;
    }
    .body {
      padding: 36px 28px 28px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #051d3b;
      margin-bottom: 16px;
    }
    .intro {
      font-size: 14px;
      color: #4a5c75;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .intro strong {
      font-weight: 700;
      color: #051d3b;
    }
    .notice p {
      font-size: 12.5px;
      color: #516580;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #8c9cb6;
    }
    .footer a {
      color: #1a3b66;
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="44" style="padding-right: 12px; vertical-align: middle;">
            <table border="0" cellpadding="0" cellspacing="0" width="44" height="44"
              style="width:44px;height:44px;background-color:#ffffff;border-radius:10px;">
              <tr>
                <td align="center" valign="middle" height="44" style="border-radius:10px;padding:4px;">
                  ${logoHtml}
                </td>
              </tr>
            </table>
          </td>
          <td style="vertical-align: middle;">
            <div class="logo-name">Attendance management</div>
            <div class="logo-sub">Student management system</div>
          </td>
        </tr>
      </table>
    </div>

    <div class="body">

      <table border="0" cellpadding="0" cellspacing="0" width="44" height="44"
        style="width:44px;height:44px;background-color:#e9f1fc;border-radius:10px;margin-bottom:24px;">
        <tr>
          <td align="center" valign="middle" height="44">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a3b66" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </td>
        </tr>
      </table>

      <h1>Verify your account</h1>
      <p class="intro">
        Hi <strong>${firstName}</strong>,<br>
        Enter this verification code to complete your Attendance management signup. It expires in <strong>10 minutes</strong>.
      </p>

      <table border="0" cellpadding="0" cellspacing="0" width="100%"
        style="background-color:#f4f8fe;border-radius:16px;border:1px solid #e1ecf8;margin-bottom:24px;">
        <tr>
          <td align="center" style="padding:28px 16px 24px;">
            <p style="margin:0 0 20px;font-size:11px;font-weight:700;color:#8c9cb6;letter-spacing:1.6px;text-transform:uppercase;font-family:'DM Sans',Arial,sans-serif;">
              Verification code
            </p>
            <table border="0" cellpadding="0" cellspacing="0" align="center" role="presentation">
              <tr>
${otpDigitRow}
              </tr>
            </table>
            <p style="margin:18px 0 0;font-size:12px;color:#6b7f99;font-family:'DM Sans',Arial,sans-serif;">
              Copy the full code or enter each digit in the app.
            </p>
          </td>
        </tr>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" width="100%"
        style="background-color:#f0f5fc;border-radius:10px;border:1px solid #e1ecf8;margin-bottom:32px;">
        <tr>
          <td style="padding:14px 16px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="16" style="padding-right:10px;vertical-align:top;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3b66" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-top:2px;display:block;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </td>
                <td style="vertical-align:top;">
                  <p class="notice" style="margin:0;">If you did not request this code, you can safely ignore this email. No changes will be made to your account.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
        <tr>
          <td style="height:1px;background-color:#eef2f7;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>

      <div class="footer">
        Sent by <span style="font-weight:700;color:#1a3b66;">Attendance management</span>
        &nbsp;&middot;&nbsp; Student management system
      </div>

    </div>
  </div>
</body>
</html>

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
      return res.status(400).json({
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
