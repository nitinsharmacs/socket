const jsonParse = (text) => {
  return JSON.parse(text);
};

const jsonStringify = (json) => {
  return JSON.stringify(json);
};

module.exports = { jsonParse, jsonStringify };
