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

// Generates a random 6 character alphanumeric string
const generateRandomString = function() {

  const chars = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    1, 2, 3, 4, 5, 6, 7, 8, 9, 0
  ];

  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const lowerUpperOrNum = Math.random();

    if (lowerUpperOrNum < 0.3) {
      // Get a lowercase letter
      randomString += chars[Math.floor(Math.random() * 26)];
    } else if (lowerUpperOrNum >= 0.3 && lowerUpperOrNum < 0.6) {
      // Get an uppercase letter
      randomString += chars[Math.floor(Math.random() * 26 + 26)];
    } else {
      // Get a number
      randomString += chars[Math.floor(Math.random() * 10 + 52)];
    }
  }

  return randomString;
};

// Sends given error code and message to response
const sendResError = function(errorCode, message, res) {
  res.status(errorCode).send(`<html><h2>Error ${errorCode}</h2><p>${message}</p></html>`);
};

module.exports = { getUserByEmail, getUrlsForUser, generateRandomString, sendResError };