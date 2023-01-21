const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.00',
  register: async (server, { service, storageService, validator }) => {
    const albumsHandler = new AlbumsHandler(service, storageService, validator);
    server.route(routes(albumsHandler));
  },
};
