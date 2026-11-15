
import { Product } from "../types/product";

const STORAGE_KEY = "localProducts";
const OLD_STORAGE_KEY = "newProduct";
const DELETED_IDS_KEY = "deletedProductIds";
const OVERRIDES_KEY = "productOverrides";

export const getLocalProducts = (): Product[] => {
  if (typeof window === "undefined") return [];

  try {
    const savedProducts = localStorage.getItem(STORAGE_KEY);

    if (savedProducts) {
      return JSON.parse(savedProducts) as Product[];
    }

    const oldProduct = localStorage.getItem(OLD_STORAGE_KEY);

    if (oldProduct) {
      const product = JSON.parse(oldProduct) as Product;
      const products = [product];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      localStorage.removeItem(OLD_STORAGE_KEY);

      return products;
    }

    return [];
  } catch (error) {
    console.error("Error reading local products:", error);
    return [];
  }
};

export const saveLocalProducts = (products: Product[]): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const addLocalProduct = (product: Product): void => {
  saveLocalProducts([product, ...getLocalProducts()]);
};

export const updateLocalProduct = (updatedProduct: Product): void => {
  const products = getLocalProducts();

  saveLocalProducts(
    products.map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product
    )
  );
};

export const deleteLocalProduct = (id: number): void => {
  saveLocalProducts(
    getLocalProducts().filter((product) => product.id !== id)
  );
};

export const getDeletedProductIds = (): number[] => {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      localStorage.getItem(DELETED_IDS_KEY) || "[]"
    ) as number[];
  } catch {
    return [];
  }
};

export const addDeletedProductId = (id: number): void => {
  if (typeof window === "undefined") return;

  const ids = getDeletedProductIds();

  if (!ids.includes(id)) {
    localStorage.setItem(
      DELETED_IDS_KEY,
      JSON.stringify([...ids, id])
    );
  }
};

export const getProductOverrides = (): Record<string, Product> => {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(
      localStorage.getItem(OVERRIDES_KEY) || "{}"
    ) as Record<string, Product>;
  } catch {
    return {};
  }
};

export const saveProductOverride = (product: Product): void => {
  if (typeof window === "undefined") return;

  const overrides = getProductOverrides();

  overrides[String(product.id)] = product;

  localStorage.setItem(
    OVERRIDES_KEY,
    JSON.stringify(overrides)
  );
};
