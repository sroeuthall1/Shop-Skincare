const db = require("../config/db");

exports.getAllCategories = () => {
  const SQL = "SELECT * FROM tblcategory";
  return db.query(SQL);
};

exports.createCategory = (CategoryName, Description) => {
  const SQL = `INSERT INTO tblcategory (CategoryName, Description) VALUES (?, ?)`;
  return db.query(SQL, [CategoryName, Description]);
};

exports.deleteCategory = (id) => {
  const SQL = "DELETE FROM tblcategory WHERE CategoryId = ?";
  return db.query(SQL, [id]);
};

exports.updateCategory = (CategoryName, Description, id) => {
  const SQL = `UPDATE tblcategory SET CategoryName = ?, Description = ? WHERE CategoryId = ?`;
  return db.query(SQL, [CategoryName, Description, id]);
};
