const jwt = require("jsonwebtoken");
const { verify } = jwt;

class StatusError extends Error {
  status = "";

  constructor(message, status) {
    super(message);
    this.status = status || 500;
  }
}

const isAuth = (req, res, next) => {
  // 1. Obtener token desde cookies o headers para mobile
  let token = req.cookies?.token;
  if (!token && req.get("Authorization")) {
    token = req.get("Authorization").split(" ")[1];
  }

  if (!token) {
    const statusError = new StatusError("Unauthorized action", 401);
    return next(statusError);
  }

  // 2. Verificar token
  let decodedToken = "";
  try {
    decodedToken = verify(token, process.env.JWT_SEC);
  } catch (error) {
    const statusError = new StatusError(
      "El token ha expirado, iniciar sesión nuevamente",
      401
    );
    return next(statusError);
  }

  // 3. Validar
  if (!decodedToken) {
    const statusError = new StatusError("Unauthorized action", 401);
    return next(statusError);
  }

  // 4. Guardar info en request
  req.user = decodedToken.userId;
  next();
};

module.exports = { isAuth };
