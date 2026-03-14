const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "tbluser",
    {
      UserId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },

      UserName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      Password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      Email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      Role: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      Status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
      },

      CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      is_temp_password: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // OTP fields (បើអ្នកបាន add នៅ database)
      otp_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },

      otp_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "tbluser",
      timestamps: false,
    }
  );