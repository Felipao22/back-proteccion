const axios = require('axios');
const { City} = require('../db');
const jsonCities = require('../json/municipios.json');
const cities = jsonCities.municipios;



// SAVE DATA FROM JSON TO DB
const apiCity = async () => {
	try {
		const foundCity = await City.findOne();
		if (!foundCity) {
			await City.bulkCreate(cities) ;
			console.log(`Cities saved successfully!`)
		} else {
			console.log(`Cities already loaded`)
		}	
	} catch(error) {
		console.log(`Error at apiCity function: ${error}`);
	}
}




const getAllCities = async(req, res) => {
	try {
		const cities = await City.findAll();
		res.status(200).json(cities)
	} catch(error) {
		res.status(500).send(`Error at getAllCities controller function: ${error}`);
	}
}



module.exports = { apiCity, getAllCities }