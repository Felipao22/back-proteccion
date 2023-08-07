const jwt = require('jsonwebtoken')
const{verify} = jwt


/*
    IS AUTH CONTROLLER
*/

class StatusError extends Error {
	status= '' ;

	constructor(message, status) {
		super(message);
		this.status = status || 500;
	}
}

const isAuth = (req, res, next) => {
	// 1. Get auth header
	const authHeader = req.get('Authorization');
	console.log(authHeader)
	if (!authHeader) {
		const statusError = new StatusError('Unauthorized action', 401);
		return next(statusError);
	}

	// 2. obtain token
	let decodedToken='' ;
	try {
		const token = authHeader.split(' ')[1];
		console.log(token)
		decodedToken = verify(token, process.env.JWT_SEC);
	} catch (error) {
		const statusError = new StatusError('Unauthorized action', 401);
		return next(statusError);
	}

	// 3. verify
	if (!decodedToken) {
		const statusError = new StatusError('Unauthorized action', 401);
		return next(statusError);
	}

	req.user = decodedToken.userId;
	next();
};

module.exports={isAuth}