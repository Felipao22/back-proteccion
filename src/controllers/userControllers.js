const axios = require('axios')
const jsonUsers = require('../json/users.json');
const users = jsonUsers.usuarios
const { User, Branch } = require('../db');
const CryptoJS = require('crypto-js');

//Funcion del GET / GET ALL USERS
async function getUsers() {
  try {
    const foundUsers = await User.findAll({
      include: [{ model: Branch }],
    });
    return foundUsers;
  } catch (e) {
    return `No se encontraron usuarios cargados en la base de datos, ${e.message}`;
  }
}

// Funcion del GET / GET ALL USERS
async function getUserByEmail (email){
    try {
        const foundUser = await User.findByPk (email,{
            include: [{ model: Branch }]
        });      
        return foundUser;  
    }catch(e){
        return "No se encontró el usuario solicitado";
    }
}




const apiUsers = async () => {
  try {
    const foundUsers = await User.findOne();
    if (!foundUsers) {
      const usersToCreate = users.map(user => {
        // const encryptedPassword = CryptoJS.AES.encrypt(user.password, process.env.PASS_SEC).toString();
        return {
          ...user,
          // password: encryptedPassword,
          isAdmin: user.isAdmin ? true : false,
          isSuperAdmin: user.isSuperAdmin ? true : false // Asignar isAdmin: true si user.isAdmin es true, de lo contrario, asignar false
        };
      });

      await User.bulkCreate(usersToCreate);
      console.log(`Users saved successfully!`);
    } else {
      console.log(`Users already loaded`);
    }
  } catch (error) {
    console.log(`Error at apiUsers function: ${error}`);
  }
};



module.exports = {
    getUsers,
    getUserByEmail,
    apiUsers
}