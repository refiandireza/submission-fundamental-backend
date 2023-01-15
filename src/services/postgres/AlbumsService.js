const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album failed to add');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const getAlbum = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const getSong = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    const albumResult = await this._pool.query(getAlbum);
    const songResult = await this._pool.query(getSong);

    if (!albumResult.rows.length) {
      throw new NotFoundError('Album not found');
    }

    const album = albumResult.rows[0];
    const finalResult = {
      id: album.id,
      name: album.name,
      year: album.year,
      songs: songResult.rows,
    };

    return finalResult;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Fail to edit album, ID not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Fail to delete album, ID not found');
    }
  }
}

module.exports = AlbumsService;
