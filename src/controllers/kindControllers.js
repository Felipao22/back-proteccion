const { Kind, Category } = require("../db");
const jsonKinds = require("../json/kind.json");
const kinds = jsonKinds.tipos;
const { Op } = require("sequelize");

const addKind = async (req, res) => {
  const { name, categoryId } = req.body;

  try {
    if (!name || !categoryId) {
      return res.status(400).json({
        error:
          "Debe proporcionar un nombre y categoría para el tipo de archivo",
      });
    }

    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(400).json({ error: "Categoría no encontrada" });
    }

    const [newKind, created] = await Kind.findOrCreate({
      where: { name },
      defaults: { categoryId: category.id },
    });

    if (!created) {
      return res
        .status(400)
        .json({ error: "Ya existe un tipo de archivo con el mismo nombre" });
    }

    return res.status(201).json({
      message: "Tipo de archivo agregado correctamente",
      kind: newKind,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "No se pudo agregar el tipo de archivo" });
  }
};

// SAVE DATA FROM JSON TO DB
const apiKind = async () => {
  try {
    const foundKind = await Kind.findOne();
    if (!foundKind) {
      await Kind.bulkCreate(kinds);
      console.log(`Kinds saved successfully!`);
    } else {
      console.log(`Kinds already loaded`);
    }
  } catch (error) {
    console.log(`Error at apiKind function: ${error}`);
  }
};

async function getKindByIdController(req, res) {
  const { id } = req.params;

  try {
    const kind = await getKindById(id);

    if (kind) {
      res.json(kind);
    } else {
      res.status(404).json({ error: "Tipo de archivo no encontrado" });
    }
  } catch (error) {
    res.status(500).send(error.message);
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
        },
      },
    });
    if (foundKindsName.length) {
      return foundKindsName;
    } else {
      return "No se encontraron tipos asociados";
    }
  } catch (error) {
    throw new Error(`No se encontró el tipo con el nombre ${name}, ${error}`);
  }
}

//Fucion del GET category, redirecciona segun haya query name o no
function getKind(name) {
  if (name) {
    return getKindByName(name);
  } else {
    return getAllKinds();
  }
}

async function getKindController(req, res) {
  const { name } = req.query;

  try {
    let kinds;

    if (name) {
      kinds = await getKindByName(name);
    } else {
      kinds = await getAllKinds();
      kinds.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.send(kinds);
  } catch (error) {
    res.status(500).send(error.message); // Accedemos al mensaje del error
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
  addKind,
  apiKind,
  getKindController,
  getKindByIdController,
};
