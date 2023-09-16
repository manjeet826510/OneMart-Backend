import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    //payload object
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    //signing payload object
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
    //return a token string
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    if (authorization === "RazorPay") {
      return;
    }
    const token = authorization.slice(7, authorization.length); //Bearer XXXXXX
    // console.log(token);
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      // decode = payload object which passed while signing jwt
      if (err) {
        // console.log("inside err");
        res.status(401).send({ message: "Invalid Token" });
      } else {
        // console.log(decode); decode = { userInfo }
        req.user = decode;
        next();
      }
    });
  } else {
    res.status(401).send({ message: "No Token" });
  }
};

export const isAdmin = (req, res, next)=>{
  // console.log("checking isAdmin");
  if(req.user && req.user.isAdmin){
    next();
  }
  else{
    res.status(401).send({"message": "Invalid Admin Token"})
  }
}
