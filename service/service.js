const fs = require("fs/promises");
const moment = require("moment");

const logError = async (controller, err, res) => {
  try {
    const timestamp = moment().format("DD/MM/YYYY HH:mm:ss");
    const folderPath = "./logs";
    const filePath = `${folderPath}/${controller + moment().format("YYYY-MM-DD")}.txt`;

    // Create "logs" folder if missing
    await fs.mkdir(folderPath, { recursive: true });

    const logMessage = `[${timestamp}] ${err.message}\n`;

    // Append error message to log file
    await fs.appendFile(filePath, logMessage);
  } catch (error) {
    console.error("Error writing to log file:", error);
  }

  // Send generic error response if res object exists and headers are not sent
  if (res && !res.headersSent) {
    return res.status(500).send("Internal Server Error!");
  }
};

module.exports = logError;
