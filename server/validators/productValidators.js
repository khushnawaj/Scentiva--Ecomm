const { z } = require("zod");

const createProductSchema = z.object({
  title: z.string().min(2, "Product title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(1, "Price must be at least ₹1"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  stock: z.number().min(0, "Stock cannot be negative").optional(),
});

const updateProductSchema = createProductSchema.partial();  
// meaning: all fields optional for update

module.exports = {
  createProductSchema,
  updateProductSchema,
};
