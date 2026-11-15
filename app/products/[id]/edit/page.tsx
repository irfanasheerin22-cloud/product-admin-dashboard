
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductById } from "@/api/productService";
import { Product } from "@/types/product";
import {
  getLocalProducts,
  updateLocalProduct,
  getProductOverrides,
  saveProductOverride,
} from "@/utils/localProducts";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load product
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const id = Number(params.id);

        if (!id || Number.isNaN(id)) {
          setError("Product Not Found");
          return;
        }

        // Check locally added products
        const localProduct = getLocalProducts().find(
          (item) => item.id === id
        );

        if (localProduct) {
          setProduct(localProduct);
          setTitle(localProduct.title || "");
          setPrice(String(localProduct.price ?? ""));
          setStock(String(localProduct.stock ?? ""));
          setCategory(localProduct.category || "");
          setDescription(localProduct.description || "");
          return;
        }

        // Check saved edits
        const overrides = getProductOverrides();
        const savedProduct = overrides[String(id)];

        if (savedProduct) {
          setProduct(savedProduct);
          setTitle(savedProduct.title || "");
          setPrice(String(savedProduct.price ?? ""));
          setStock(String(savedProduct.stock ?? ""));
          setCategory(savedProduct.category || "");
          setDescription(savedProduct.description || "");
          return;
        }

        // Load original API product
        const data = await getProductById(id);

        setProduct(data);
        setTitle(data.title || "");
        setPrice(String(data.price ?? ""));
        setStock(String(data.stock ?? ""));
        setCategory(data.category || "");
        setDescription(data.description || "");
      } catch (err) {
        console.error("Product loading error:", err);
        setError("Product Not Found");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.id]);

  // Save product
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (saving) return;

    if (!title.trim()) {
      setError("Product title is required.");
      return;
    }

    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (
      price === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      stock === "" ||
      !Number.isFinite(numericStock) ||
      numericStock < 0 ||
      !Number.isInteger(numericStock)
    ) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    if (!product) {
      setError("Product Not Found");
      return;
    }

    try {
      setSaving(true);

      const updatedProduct: Product = {
        ...product,
        title: title.trim(),
        price: numericPrice,
        stock: numericStock,
        category: category.trim(),
        description: description.trim(),
      };

      // Save locally added products
      if (updatedProduct.id < 0) {
        updateLocalProduct(updatedProduct);
      } else {
        // Save API product changes in browser storage
        saveProductOverride(updatedProduct);
      }

      setProduct(updatedProduct);
      setSuccess("Product updated successfully!");

      // Reload Products page after saving
      setTimeout(() => {
        window.location.href = "/products";
      }, 800);
    } catch (err) {
      console.error("Product update error:", err);
      setError("Failed to update product. Please try again.");
      setSaving(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          <p className="text-slate-600">Loading product...</p>
        </div>
      </main>
    );
  }

  // Product not found
  if (error === "Product Not Found" || !product) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Product Not Found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The product could not be loaded.
          </p>

          <button
            type="button"
            onClick={() => router.push("/products")}
            className="mt-6 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Edit Product
            </h1>

            <p className="text-sm text-slate-500">
              Update product information
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/products/${product.id}`)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Form */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">

            {/* Title */}
            <div className="sm:col-span-2">
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Product Title *
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="price"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Price *
              </label>

              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* Stock */}
            <div>
              <label
                htmlFor="stock"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Stock *
              </label>

              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* Category */}
            <div className="sm:col-span-2">
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Category *
              </label>

              <input
                id="category"
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              role="status"
              className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push(`/products/${product.id}`)}
              className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
