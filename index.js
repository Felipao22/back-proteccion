require("dotenv").config();
const server = require("./src/app.js");
const { conn } = require("./src/db.js");
const { apiCity } = require("./src/controllers/cityControllers");
const { apiKind } = require("./src/controllers/kindControllers.js");
const { apiUsers } = require("./src/controllers/userControllers.js");
3;
const { apiCategory } = require("./src/controllers/categoryControllers.js");

const PORT = process.env.PORT ?? 3002;

// Syncing all the models at once.
conn.sync({ force: false }).then(() => {
  server.listen(PORT, "0.0.0.0", async () => {
    await apiCity();
    await apiCategory();
    await apiKind();
    await apiUsers();
    console.log(`Server is listening on port ${PORT}`); // eslint-disable-line no-console
  });
});
