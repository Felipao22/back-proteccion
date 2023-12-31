//                       _oo0oo_
//                      o8888888o
//                      88" . "88
//                      (| -_- |)
//                      0\  =  /0
//                    ___/`---'\___
//                  .' \\|     |// '.
//                 / \\|||  :  |||// \
//                / _||||| -:- |||||- \
//               |   | \\\  -  /// |   |
//               | \_|  ''\---/''  |_/ |
//               \  .-\__  '-'  ___/-. /
//             ___'. .'  /--.--\  `. .'___
//          ."" '<  `.___\_<|>_/___.' >' "".
//         | | :  `- \`.;`\ _ /`;.`/ - ` : | |
//         \  \ `_.   \_ __\ /__ _/   .-` /  /
//     =====`-.____`.___ \_____/___.-`___.-'=====
//                       `=---='
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const server = require('./src/app.js');
const { conn } = require('./src/db.js');
const {apiCity} = require('./src/controllers/cityControllers')
const {apiKind} = require('./src/controllers/kindControllers.js');
const { apiUsers } = require('./src/controllers/userControllers.js');3
const { apiCategory } =require('./src/controllers/categoryControllers.js')

const PORT = process.env.PORT ?? 3001;

// Syncing all the models at once.
conn.sync({ force: false }).then(() => {
  server.listen(PORT, async () => {
    await apiCity();
    await apiCategory();
    await apiKind();
    await apiUsers();
    console.log(`Server is listening on port ${PORT}`); // eslint-disable-line no-console
  });
});
