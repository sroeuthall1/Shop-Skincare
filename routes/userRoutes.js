
const { GetList, Create, Update, Delete, sendOTP, verifyOTP, resetPassword, ResetPasswordByAdmin, ForgotPassword, Register, Login } = require("../controllers/userController");
const auth = require("../middlewares/auth");
const allowRoles = require("../middlewares/allowRoles");

const user = (app) => {
    app.post("/user/register", Register);
    app.post("/user/login", Login);

    app.get("/user",auth, GetList);
    app.post("/user/create", auth, Create);
    app.put("/user/update/:id", auth, allowRoles("Admin"), Update);
    app.delete("/user/delete/:id", auth, allowRoles("Admin"), Delete);

    app.post('/user/send-otp', sendOTP); 
    app.post('/user/verify-otp', verifyOTP);
    app.post('/user/reset-password', resetPassword);

    // Admin reset password
    app.put("/user/reset-password/:id", auth, allowRoles("Admin"), ResetPasswordByAdmin);

    // Admin forgot password
    app.post("/user/forgot-password", ForgotPassword);
    
};

module.exports = user;
