const { ApolloServer } = require("apollo-server");
const resolvers = require("./db/resolvers");
const typeDefs = require('./db/schema');
const conectarDB = require('./db/db');
const jwt = require("jsonwebtoken");
require('dotenv').config({path: 'variables.env'});


//Conectar a la base de datos
conectarDB();

//Servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) =>  {
        // console.log(req.headers['authorization']);

        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token, process.env.SECRETA);
                // console.log(usuario);

                return {
                    usuario
                }
            } catch (error) {
                console.log('Hubo un error');
                console.log(error);
            }
        }
    }
});

//Arrancar el servidor
server.listen().then(({url}) => {
    console.log(`Servidor Listo en la URL ${url}`);
});