const { Category, Kind, File } = require("../db");
const jsonCategories = require("../json/category.json");
const categories = jsonCategories.categorías;
const { Op } = require('sequelize');

async function addCategory(req, res) {
  const { name } = req.body;

  try {
    if (!name) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un nombre para la categoría" });
    }

    const [newCategory, created] = await Category.findOrCreate({
      where: { name },
    });

    if (!created) {
      return res
        .status(400)
        .json({ error: "Ya existe una categoría con el mismo nombre" });
    }

    return res.status(201).json({
      message: "Categoría agregada correctamente",
      category: newCategory,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "No se pudo agregar la categoría" });
  }
}

async function apiCategory() {
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
}

async function getCategoryByIdController(req, res) {
  const { id } = req.params;

  try {
    const category = await getCategoryById(id);

    if (typeof category === "object") {
      res.json(category);
    } else {
      res.status(404).json(category);
    }
  } catch (error) {
    res.status(500).send(error.message);
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
  

async function getCategoriesByName(name) {
  try {
    const foundCategoriesName = await Category.findAll({
      where: {
        name: {
          [Op.iLike]: `%${name}%`,
        },
      },
    });
    return foundCategoriesName;
  } catch (error) {
    throw new Error(`No se encontró la categoría con el nombre ${name}, ${error}`);
  }
}

async function getCategoryController(req, res) {
    const { name } = req.query;
  
    try {
      let categories;
  
      if (name) {
        categories = await getCategoriesByName(name);
      } else {
        categories = await getAllCategories();
        categories.sort((a, b) => a.name.localeCompare(b.name));
      }
  
      res.send(categories);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
  

async function getAllCategories() {
  try {
    const foundCategories = await Category.findAll({
      include: [{ model: Kind }]
    });
    return foundCategories;
  } catch (error) {
    throw new Error(`No se encontraron categorías cargadas en la base de datos, ${error}`);
  }
}

async function getFilesByCategory(req, res) {
  const { categoryId } = req.params;

  try {
    const category = await Category.findOne({
      where: {
        id: categoryId,
      },
      include: [{
        model: Kind,
        attributes: ['id'],
      }],
    });

    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const kindId = category.Kind.id;

    const files = await File.findAll({
      where: {
        kindId,
      },
    });

    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener archivos por categoría" });
  }
}

async function getFilesByCategoryController(req, res) {
  const { categoryId } = req.params;

  try {
    // Encuentra la categoría asociada con el categoryId
    const category = await Category.findByPk(categoryId, {
      include: {
        model: Kind,
        include: File,
      },
    });

    if (!category) {
      // Si no se encuentra la categoría, devuelve un error 404
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    // Accede a los archivos a través de las relaciones
    const files = category.Kinds.reduce((acc, kind) => {
      if (kind.Files && kind.Files.length > 0) {
        acc.push(...kind.Files);
      }
      return acc;
    }, []);

    // Devuelve los archivos como respuesta
    res.json(files);
  } catch (error) {
    console.error(error);
    // Devuelve un mensaje de error si ocurre un problema al obtener los archivos
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = {
  addCategory,
  apiCategory,
  getCategoryController,
  getCategoryByIdController,
  getFilesByCategory,
  getFilesByCategoryController
};
