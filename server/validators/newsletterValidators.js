// server/validators/newsletterValidators.js
const { z } = require("zod");

const newsletterSubscribeSchema = z.object({
  email: z.string().email("Valid email is required"),
});

module.exports = { newsletterSubscribeSchema };
