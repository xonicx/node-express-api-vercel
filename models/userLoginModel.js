const db = require('../db');

const getUserByCredentials = (userid, phone) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM user_tb WHERE userid = ? AND phone = ?';
    db.get(query, [userid, phone], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

module.exports = { getUserByCredentials };
