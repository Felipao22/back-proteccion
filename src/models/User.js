const { DataTypes } = require("sequelize");
const uniqid = require("uniqid");
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define("user", {
    userId: {
      type: DataTypes.STRING,
      defaultValue: () => uniqid(),
    },
    email: {
      type: DataTypes.STRING,

      primaryKey: true,
    },
    password: {
      type: DataTypes.STRING,

    },
    nombreEmpresa: {
      type: DataTypes.STRING,
    },
    cuit: {
      type: DataTypes.STRING,
    },
    nombreSede: {
      type: DataTypes.STRING,

    },
    ciudad: {
      type: DataTypes.STRING,

    },
    direccion: {
      type: DataTypes.STRING,

    },
    telefono: {
      type: DataTypes.STRING,

    },
    emails: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },
    accessUser: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },
    emailJefe: {
      type: DataTypes.STRING,
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isSuperAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
};
