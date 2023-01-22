const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationsService, cacheService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addPlaylist(name, owner) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const { rows } = await this._pool.query(query);

    if (!rows.length) {
      throw new InvariantError('Fail to add playlist');
    }

    this._cacheService.delete(`playlist:${owner}`);
    return rows[0].id;
  }

  async getPlaylists(owner) {
    try {
      const result = await this._cacheService.get(`playlist:${owner}`);
      const playlist = JSON.parse(result);
      return {
        cache: true,
        playlist,
      };
    } catch (error) {
      const query = {
        text: `
        SELECT playlists.id, playlists.name, users.username
        FROM playlists
          LEFT JOIN users ON users.id = playlists.owner
          LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
        WHERE playlists.owner = $1 OR collaborations.user_id = $1
      `,
        values: [owner],
      };
      const result = await this._pool.query(query);

      await this._cacheService.set(
        `playlist:${owner}`,
        JSON.stringify(result.rows),
      );

      return {
        cache: false,
        playlists: result.rows,
      };
    }
  }

  async getPlaylistById(playlistId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const { rows } = await this._pool.query(query);
    if (!rows.length) {
      throw new NotFoundError('Playlist not found');
    }

    return rows[0];
  }

  async deletePlaylistById(Id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id, owner',
      values: [Id],
    };

    const { rows } = await this._pool.query(query);
    if (!rows.length) {
      throw new InvariantError('Fail to delete playlist. Id not found');
    }
    this._cacheService.delete(`playlist:${rows[0].owner}`);
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlist_song-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const { rows } = await this._pool.query(query);
    if (!rows.length) {
      throw new InvariantError('Fail to add song to playlists');
    }
  }

  async getPlaylistSongsById(playlistId, userId) {
    await this.verifyPlaylistAccess(playlistId, userId);

    const getPlaylist = {
      text: 'SELECT playlists.id, playlists.name, users.username FROM playlists LEFT JOIN users ON users.id = playlists.owner WHERE playlists.id = $1',
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(getPlaylist);
    if (!playlistResult.rows.length) {
      throw new NotFoundError('Playlist not found');
    }

    const getSongs = {
      text: 'SELECT songs.id, songs.title, songs.performer FROM songs LEFT JOIN playlistsongs on playlistsongs.song_id = songs.id WHERE playlistsongs.playlist_id = $1',
      values: [playlistId],
    };

    const songsResult = await this._pool.query(getSongs);

    const playlist = playlistResult.rows[0];

    const result = {
      id: playlist.id,
      name: playlist.name,
      username: playlist.username,
      songs: songsResult.rows,
    };
    return result;
  }

  async deleteSongFromPlaylist(playlistId, songsId) {
    const query = {
      text: `DELETE FROM playlistsongs 
      WHERE playlist_id = $1 AND song_id = $2
      RETURNING id`,
      values: [playlistId, songsId],
    };

    const { rows } = await this._pool.query(query);

    if (!rows.length) {
      throw new InvariantError('Fail to delete song');
    }
  }

  async getPlaylistActivitiesById(playlistId) {
    await this.getPlaylistById(playlistId);
    const query = {
      text: `SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time 
      FROM playlist_song_activities 
      LEFT JOIN songs ON songs.id = playlist_song_activities.song_id 
      LEFT JOIN users ON users.id = playlist_song_activities.user_id 
      WHERE playlist_id = $1 
      ORDER BY playlist_song_activities.time ASC`,
      values: [playlistId],
    };

    const { rows } = await this._pool.query(query);

    return rows;
  }

  async addActivity(playlistId, songId, userId, action) {
    const id = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };

    const { rows } = await this._pool.query(query);
    if (!rows.length) {
      throw new InvariantError('Fail to add activity');
    }
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const { rows } = await this._pool.query(query);
    if (!rows.length) {
      throw new NotFoundError('Playlist not found');
    }

    if (rows[0].owner !== userId) {
      throw new AuthorizationError('You don\'t have access for this resource');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const { rows } = await this._pool.query(query);
    if (!rows.length) {
      throw new NotFoundError('Playlist not found');
    }

    if (rows[0].owner !== userId) {
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch (error) {
        throw new AuthorizationError('You don\'t have access for this resource');
      }
    }
  }
}

module.exports = PlaylistsService;
