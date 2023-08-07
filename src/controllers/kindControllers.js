const { Kind } = require("../db");
const axios = require("axios");
const jsonKinds = require("../json/kind.json");
const kinds = jsonKinds.tipos;
const {Op} = require('sequelize')

async function addKinds(kind) {
  try {
    const newKind = await Kind.create({ ...kind });
  } catch (error) {
    throw new error(
      `No se puede agregar el tipo a la base de datos, ${error.message}`
    );
  }
}

// SAVE DATA FROM JSON TO DB
const apiKind = async () => {
	try {
		const foundKind = await Kind.findOne();
		if (!foundKind) {
			await Kind.bulkCreate(kinds) ;
			console.log(`Kinds saved successfully!`)
		} else {
			console.log(`Kinds already loaded`)
		}	
	} catch(error) {
		console.log(`Error at apiKind function: ${error}`);
	}
}

async function getKindById(id) {
  try {
      const foundKind = await Kind.findByPk(id);
      return foundKind;
  } catch (error) {
      return "No se encontró el tipo solicitado";
  }
}

//Funcion interna, es llamada por getCategory cuando viene query name
async function getKindByName(name) {
  try {
      const foundKindsName = await Kind.findAll({
          where: {
              name: {
                  [Op.iLike]: `%${name}%`,
              }
          }
      });
      if (foundKindsName.length) {
          return foundKindsName
      } else {
          return "No se encontraron tipos asociados"
      }
  } catch (error) {
      throw new Error(`No se encontró el tipo con el nombre ${name}, ${error}`);
  }

}


//Fucion del GET category, redirecciona segun haya query name o no 
function getKind(name) {
  if (name) {
      return getKindByName(name);
  }
  else {
      return getAllKinds();
  }
}

async function getAllKinds() {
  try {
    const foundKinds = await Kind.findAll({});
    return foundKinds;
  } catch (error) {
    throw new error(
      `No se encontraron tipos cargados en la base de datos, ${error}`
    );
  }
}

module.exports = {
  addKinds,
  apiKind,
  getKind,
  getKindById
};
