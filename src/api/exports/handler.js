const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(exportsService, playlistsService, validator) {
    this._exportsService = exportsService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    autoBind(this);
  }

  async postExportPlaylistHandler(request, h) {
    this._validator.validateExportsPlaylistPayload(request.payload);
    const { id: userId } = request.auth.credentials;

    const { playlistId } = request.params;
    await this._playlistsService.verifyPlaylistOwner(playlistId, userId);

    const message = {
      playlistId,
      targetEmail: request.payload.targetEmail,
    };

    await this._exportsService.sendMessage(
      'export:playlist',
      JSON.stringify(message),
    );

    const response = h.response({
      status: 'success',
      message: 'Your request is in process',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
