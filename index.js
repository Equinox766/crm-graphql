const { ApolloServer } = require("apollo-server");
const resolvers = require("./db/resolvers");
const typeDefs = require('./db/schema');

//Servidor
const server = new ApolloServer({
    typeDefs,
    resolvers
});

//Arrancar el servidor
server.listen().then(({url}) => {
    console.log(`Servidor Listo en la URL ${url}`);
});