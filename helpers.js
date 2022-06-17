// Checks if email matches in users database, and returns the id if it does
const getUserByEmail = function(email, database) {
  for (const key in database) {
    if (database[key].email === email) {
      return key;
    }
  }
};

// Finds and returns all urls in database for current logged in user
const getUrlsForUser = function(id, database) {
  const filteredUrlDatabase = {};
  for (const url in database) {
    if (database[url].userID === id) {
      filteredUrlDatabase[url] = database[url];
    }
  }
  return filteredUrlDatabase;
};

module.exports = { getUserByEmail, getUrlsForUser };