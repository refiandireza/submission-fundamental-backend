/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('playlistsongs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  pgm.addConstraint(
    'playlistsongs',
    'unique_id',
    'UNIQUE(playlist_id, song_id)',
  );
  pgm.addConstraint(
    'playlistsongs',
    'fk_playlist_id',
    'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE',
  );
  pgm.addConstraint(
    'playlistsongs',
    'fk_song_id',
    'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('playlistsongs');
};
