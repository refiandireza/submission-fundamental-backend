/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('collaborations', {
    id: {
      type: 'VARCHAR(32)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(32)',
      notNull: true,
      // references: '"playlists"',
      // onDelete: 'cascade',
    },
    user_id: {
      type: 'VARCHAR(32)',
      notNull: true,
      // references: '"users"',
      // onDelete: 'cascade',
    },
  });

  // add unique constraint
  pgm.addConstraint('collaborations', 'fk_unique_id', 'UNIQUE(playlist_id, user_id)');

  // add foreign key
  pgm.addConstraint('collaborations', 'fk_users_id', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE');

  pgm.addConstraint('collaborations', 'fk_playlists_id', 'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  pgm.dropTable('collaborations');
};
