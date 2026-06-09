const sequelize = require("./config");
const Payment = require("../models/Payment");

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión a PostgreSQL establecida");

    await sequelize.sync({ alter: false });
    console.log("Modelos sincronizados con la base de datos");

    return true;
  } catch (error) {
    console.error("[ERROR] Error al inicializar la BD:", error);
    return false;
  }
};

module.exports = { initDatabase, sequelize };
