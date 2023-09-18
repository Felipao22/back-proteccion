const { DataTypes } = require("sequelize");
const uniqid = require("uniqid");
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define(
    "kind",
    {
      id: {
        type: DataTypes.STRING,
        defaultValue: () => uniqid(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );
};
