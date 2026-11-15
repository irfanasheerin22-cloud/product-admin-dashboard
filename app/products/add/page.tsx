
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/api/axios";
import { Product } from "@/types/product";
import { addLocalProduct } from "@/utils/localProducts";

export default function AddProductPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationErrors: string[] = [];

    if (!title.trim()) {
      validationErrors.push("Product title is required.");
    }

    if (!category.trim()) {
      validationErrors.push("Category is required.");
    }

    if (!price.trim()) {
      validationErrors.push("Price is required.");
    } else if (
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0
    ) {
      validationErrors.push("Price must be greater than 0.");
    }

    if (!stock.trim()) {
      validationErrors.push("Stock is required.");
    } else if (
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      validationErrors.push("Stock must be a whole number.");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors([]);
      setSuccess("");

      const response = await api.post("/products/add", {
        title: title.trim(),
        price: Number(price),
        stock: Number(stock),
        category: category.trim(),
        description: description.trim(),
      });

      const newProduct: Product = {
        ...response.data,
        id: -Date.now(),
        title: title.trim(),
        price: Number(price),
        stock: Number(stock),
        category: category.trim(),
        description: description.trim(),
        discountPercentage: response.data.discountPercentage ?? 0,
        rating: response.data.rating ?? 0,
        images: response.data.images ?? [],
        thumbnail: response.data.thumbnail ?? "",
      };

      addLocalProduct(newProduct);

      setSuccess("Product added successfully!");

      setTitle("");
      setPrice("");
      setStock("");
      setCategory("");
      setDescription("");
    } catch (error) {
      console.error("Add product error:", error);

      setErrors([
        "Failed to add product. Please try again.",
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">

        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="mb-4 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to Products
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            Add Product
          </h1>

          <p className="mt-1 text-slate-500">
            Create a new product for the dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-6 shadow-sm"
        >
          {errors.length > 0 && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <p className="font-semibold text-red-700">
                Please fix the following:
              </p>

              <ul className="mt-2 list-disc pl-5 text-sm text-red-600">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
            >
              {success}
            </div>
          )}

          <div className="space-y-5">

            <div>
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
                placeholder="Enter product title"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </div>

            <div>
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
                placeholder="Example: smartphones"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </div>

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
                placeholder="Enter price"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </div>

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
                placeholder="Enter stock quantity"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </div>

            <div>
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
                placeholder="Enter product description"
                disabled={saving}
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </div>

          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() => router.push("/products")}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Product"}
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}
