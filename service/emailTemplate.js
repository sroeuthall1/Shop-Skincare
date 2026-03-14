const resetPasswordTemplate = (username, tempPassword) => {
  return `
  <div style="font-family: Arial; max-width:600px; margin:auto">
    <h2>Password Reset</h2>
    <p>Hello <b>${username}</b>,</p>
    <p>Your temporary password is:</p>
    <h3 style="color:#4f46e5">${tempPassword}</h3>
    <p>This password will expire in <b>10 minutes</b>.</p>
    <hr/>
    <p style="font-size:12px;color:#666">
      Please login and change your password immediately.
    </p>
  </div>
  `;
};

module.exports = { resetPasswordTemplate };
