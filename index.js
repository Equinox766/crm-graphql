const { ApolloServer } = require("apollo-server");
const resolvers = require("./db/resolvers");
const typeDefs = require('./db/schema');
const conectarDB = require('./db/db');


//Conectar a la base de datos
conectarDB();

//Servidor
const server = new ApolloServer({
    typeDefs,
    resolvers
});

//Arrancar el servidor
server.listen().then(({url}) => {
    console.log(`Servidor Listo en la URL ${url}`);
});