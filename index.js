const { ApolloServer } = require("apollo-server");
const resolvers = require("./db/resolvers");
const typeDefs = require('./db/schema');
const conectarDB = require('./db/db');
const jwt = require("jsonwebtoken");
const PORT = process.env.PORT || 4000;
require('dotenv').config({path: 'variables.env'});


//Conectar a la base de datos
conectarDB();

//Servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) =>  {


        
        // console.log(req.headers);

        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);

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
server.listen(PORT, () => {
    console.log(`Tu server esta listo en el ${PORT}`);
})
