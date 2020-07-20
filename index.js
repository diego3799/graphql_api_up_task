const { ApolloServer } = require("apollo-server");

const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");

require('dotenv').config({path:'variables.env'})

const conectarDB = require("./config/db");

const jwt= require('jsonwebtoken')

conectarDB();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization || "";

    if(token){
        try {
            const usuario= jwt.verify(token.replace('Bearer ',""),process.env.SECRETA)
            return {
                usuario
            }
        } catch (error) {
            console.log(error);
        }
    }
  },
});

server.listen().then(({ url }) => console.log(`Servidor Listo en ${url}`));
