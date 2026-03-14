// const jwt = require("jsonwebtoken");
// const logError = require("../service/service");

// const Login = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     const [rows] = await db.query(
//       "SELECT * FROM tbluser WHERE UserName = ? OR Password = ? LIMIT 1",
//       [username, username]
//     );

//     if (rows.length === 0) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     const user = rows[0];

//     if (
//       user.ResetPasswordExpire &&
//       new Date() > new Date(user.ResetPasswordExpire)
//     ) {
//       return res.status(401).json({
//         message: "Temporary password expired",
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.Password);

//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid password" });
//     }

//     const token = jwt.sign(
//       {
//         id: user.UserId,
//         role: user.Role,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRE }
//     );

//     res.json({
//       message: "Login success",
//       token,
//       user: {
//         UserId: user.UserId,
//         UserName: user.UserName,
//         Email: user.Email,
//         Role: user.Role,
//       },
//     });
//   } catch (error) {
//     logError("User", error, res);
//   }
// };

// module.exports = Login;
