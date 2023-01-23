const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
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
      coverUrl: album.cover,
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

  async addAlbumCoverById(id, path) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [path, id],
    };

    const { rows } = await this._pool.query(query);

    if (!rows.length) {
      throw new NotFoundError('Fail to add item, ID not found');
    }
  }

  async addAlbumLikeById(albumId, userId) {
    const id = `like-${nanoid(16)}`;
    const isLiked = {
      text: `SELECT id from user_album_likes
      WHERE user_id = $1 AND album_id = $2`,
      values: [userId, albumId],
    };

    const isLikedResult = await this._pool.query(isLiked);

    if (!isLikedResult.rows.length) {
      const query = {
        text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
        values: [id, userId, albumId],
      };

      const { rows } = await this._pool.query(query);

      if (!rows[0].id) {
        throw new InvariantError('Can\'t procces Like action');
      }
    } else {
      await this.deleteAlbumLikedById(albumId, userId);
    }

    await this._cacheService.delete(`album-likes:${albumId}`);
  }

  async deleteAlbumLikedById(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const { rows } = await this._pool.query(query);
    if (!rows.length) {
      throw new NotFoundError('Unlike action failed');
    }
  }

  async getAlbumLikesById(albumId) {
    try {
      const result = await this._cacheService.get(`album-likes:${albumId}`);
      /* eslint radix: ["error", "as-needed"] */
      const likes = parseInt(result);
      return {
        cache: true,
        likes,
      };
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(id) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const { rows } = await this._pool.query(query);

      if (!rows.length) {
        throw new NotFoundError('Failed to get result count');
      }

      const likes = parseInt(rows[0].count);
      await this._cacheService.set(`album-likes:${albumId}`, likes);
      return {
        cache: false,
        likes,
      };
    }
  }
}

module.exports = AlbumsService;
