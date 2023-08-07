const { DataTypes } = require("sequelize");
const uniqid = require ('uniqid');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define(
    "file",
    {
      id:{
        type: DataTypes.STRING,
        defaultValue: () => uniqid(),
        primaryKey:true,
      },
      type: {
        type: DataTypes.STRING
        },
        name: {
        type: DataTypes.STRING
        },
        data: {
        type: DataTypes.STRING
        },
        size:{
          type:DataTypes.INTEGER
        }
    }
  );
};