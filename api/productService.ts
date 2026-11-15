import api from "./axios";

export const getProducts = async (
  limit: number = 10,
  skip: number = 0
) => {
  const response = await api.get("/products", {
    params: {
      limit,
      skip,
    },
  });

  return response.data;
};

export const getProductById = async (id: number) => {
  const response = await api.get(`/products/${id}`);

  return response.data;
};

export const searchProducts = async (query: string) => {
  const response = await api.get("/products/search", {
    params: {
      q: query,
    },
  });

  return response.data;
};

export const getCategories = async () => {
  const response = await api.get("/products/categories");

  return response.data;
};

export const getProductsByCategory = async (category: string) => {
  const response = await api.get(
    `/products/category/${category}`
  );

  return response.data;
};