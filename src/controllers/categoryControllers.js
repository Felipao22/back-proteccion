const { Category, Kind } = require("../db");
const axios = require("axios");
const jsonCategories = require("../json/category.json");
const categories = jsonCategories.categorías;
const { Op } = require('sequelize');

async function addCategory(category) {
  try {
    const newCategory = await Category.create({ ...category });
  } catch (error) {
    throw new error(
      `No se puedo agregar la categoría a la base de datos, ${error.message}`
    );
  }
}

async function getCategoryById(id) {
  try {
      const foundCategory = await Category.findByPk(id, {
          include: [{ model: Kind }]
      });
      return foundCategory;
  } catch (error) {
      return "No se encontró la categoría solicitada";
  }
}

// SAVE DATA FROM JSON TO DB
const apiCategory = async () => {
  try {
    const foundCategory = await Category.findOne();
    if (!foundCategory) {
      await Category.bulkCreate(categories);
      console.log(`Categories saved successfully!`);
    } else {
      console.log(`Categories already loaded`);
    }
  } catch (error) {
    console.log(`Error at apiCategory function: ${error}`);
  }
};

//Funcion interna, es llamada por getCategory cuando viene query name
async function getCategoriesByName(name) {
  try {
      const foundCategoriesName = await Category.findAll({
          where: {
              name: {
                  [Op.iLike]: `%${name}%`,
              }
          },
          include: [{ model: Kind }]
      });
      if (foundCategoriesName.length) {
          return foundCategoriesName
      } else {
          return "No se encontraron categorías asociados"
      }
  } catch (error) {
      throw new Error(`No se encontró la categoría con el nombre ${name}, ${error}`);
  }

}


//Fucion del GET category, redirecciona segun haya query name o no 
function getCategory(name) {
  if (name) {
      return getCategoriesByName(name);
  }
  else {
      return getAllCategories();
  }
}

async function getAllCategories() {
  try {
    const foundCategories = await Category.findAll({
      include: [{ model: Kind }],
    });
    return foundCategories;
  } catch (error) {
    throw new error(
      `No se encontraron categorías cargadas en la base de datos, ${error}`
    );
  }
}

module.exports = {
  addCategory,
  getCategory,
  getCategoryById,
  apiCategory
};
