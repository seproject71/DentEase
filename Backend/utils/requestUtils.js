const pick = (body, fields) =>
  fields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }

    return payload;
  }, {});

const validateRequired = (body, fields) =>
  fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');

module.exports = { pick, validateRequired };
