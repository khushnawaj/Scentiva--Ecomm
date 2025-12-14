// Convert numeric fields from string → number
module.exports = (fields = []) => (req, res, next) => {
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.body[field] = Number(req.body[field]);
    }
  });
  next();
};
