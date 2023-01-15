const autoBind = require('auto-bind');
const ClientError = require('../../exceptions/ClientError');

class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);

    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album Added Successfully',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  // async postAlbumHandler(request, h) {
  //   try {
  //     this._validator.validateAlbumPayload(request.payload);

  //     const { name, year } = request.payload;
  //     const albumId = await this._service.addAlbum({ name, year });

  //     const response = h.response({
  //       status: 'success',
  //       data: {
  //         albumId,
  //       },
  //     });
  //     response.code(201);
  //     return response;
  //   } catch (error) {
  //     if (error instanceof ClientError) {
  //       const response = h.response({
  //         status: 'fail',
  //         message: error.message,
  //       });
  //       response.code(error.statusCode);
  //       return response;
  //     }

  //     const response = h.response({
  //       status: 'error',
  //       message: 'Maaf, terjadi kesalahan pada server',
  //     });
  //     response.code(500);
  //     console.error(error);
  //     return response;
  //   }
  // }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album Edited Successfully',
    };
  }

  // async putAlbumByIdHandler(request, h) {
  //   try {
  //     this._validator.validateAlbumPayload(request.payload);

  //     const {id} = request.params;
  //     const {name, year} = request.payload;

  //     await this._service.editAlbumById(id, {name, year});

  //     return {
  //       status: 'success',
  //       message: 'Album berhasil diperbarui',
  //     };
  //   } catch (error) {
  //     if (error instanceof ClientError) {
  //       const response = h.response({
  //         status: 'fail',
  //         message: error.message,
  //       });
  //       response.code(error.statusCode);
  //       return response;
  //     }

  //     const response = h.response({
  //       status: 'error',
  //       message: 'Maaf, terjadi kesalahan pada server',
  //     });
  //     response.code(500);
  //     return response;
  //   }
  // }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album Has Been Deleted',
    };
  }
}

module.exports = AlbumsHandler;
