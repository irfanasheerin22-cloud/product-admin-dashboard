
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProducts, getCategories } from "@/api/productService";
import { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import {
  getLocalProducts,
  deleteLocalProduct,
  getDeletedProductIds,
  addDeletedProductId,
  getProductOverrides,
} from "@/utils/localProducts";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize")) || 10
  );
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) router.push("/");
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts(200, 0);
        const localProducts = getLocalProducts();
        const deletedIds = getDeletedProductIds();
        const overrides = getProductOverrides();

        const combinedMap = new Map<number, Product>();

        data.products.forEach((product: Product) => {
          combinedMap.set(product.id, product);
        });

        localProducts.forEach((product: Product) => {
          combinedMap.set(product.id, product);
        });

        Object.values(overrides).forEach((product: Product) => {
          combinedMap.set(product.id, product);
        });

        const combinedProducts = Array.from(combinedMap.values()).filter(
          (product) => !deletedIds.includes(product.id)
        );

        setProducts(combinedProducts);

        const categoryData = await getCategories();

        const apiCategories = categoryData.map(
          (item: { slug: string; name: string }) => item.slug
        );

        const localCategories = localProducts.map(
          (product) => product.category
        );

        const overrideCategories = Object.values(overrides).map(
          (product) => product.category
        );

        setCategories(
          Array.from(
            new Set([
              ...apiCategories,
              ...localCategories,
              ...overrideCategories,
            ])
          )
        );
      } catch (err) {
        console.error("Product loading error:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase().trim();

      result = result.filter(
        (product) =>
          product.title.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      );
    }

    if (category) {
      result = result.filter((product) => product.category === category);
    }

    switch (sort) {
      case "title-asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating-asc":
        result.sort((a, b) => a.rating - b.rating);
        break;
      case "rating-desc":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [products, debouncedSearch, category, sort]);

  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const displayedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalProducts = products.length;

  const totalCategories = new Set(
    products.map((product) => product.category)
  ).size;

  const totalStock = products.reduce(
    (sum, product) => sum + (Number(product.stock) || 0),
    0
  );

  const lowStock = products.filter(
    (product) => product.stock <= 10
  ).length;

  const updateUrl = (
    newPage: number,
    newPageSize: number,
    newSearch = search,
    newCategory = category,
    newSort = sort
  ) => {
    const params = new URLSearchParams();

    params.set("page", String(newPage));
    params.set("pageSize", String(newPageSize));

    if (newSearch.trim()) params.set("search", newSearch);
    if (newCategory) params.set("category", newCategory);
    if (newSort) params.set("sort", newSort);

    router.push(`/products?${params.toString()}`);
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      if (product.id < 0) {
        deleteLocalProduct(product.id);
      } else {
        addDeletedProductId(product.id);
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete product. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-2xl bg-white px-10 py-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="font-medium text-slate-600">Loading products...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <p className="font-medium text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const summaryCards = [
    {
      title: "Total Products",
      value: totalProducts.toLocaleString(),
      description: "Products available",
      icon: "📦",
      color: "blue",
      iconBg: "bg-blue-100",
      valueColor: "text-blue-700",
    },
    {
      title: "Total Categories",
      value: totalCategories.toLocaleString(),
      description: "Unique categories",
      icon: "🗂️",
      color: "violet",
      iconBg: "bg-violet-100",
      valueColor: "text-violet-700",
    },
    {
      title: "Total Stock",
      value: totalStock.toLocaleString(),
      description: "Units in inventory",
      icon: "📊",
      color: "emerald",
      iconBg: "bg-emerald-100",
      valueColor: "text-emerald-700",
    },
    {
      title: "Low Stock",
      value: lowStock.toLocaleString(),
      description: "10 or fewer units",
      icon: "⚠️",
      color: "orange",
      iconBg: "bg-orange-100",
      valueColor: "text-orange-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-800 to-blue-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-300">
                Admin Panel
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Product Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Manage, monitor and organize your products.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              ↪ Logout
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your inventory at a glance
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">
                    {card.title}
                  </p>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} text-2xl`}>
                    {card.icon}
                  </div>
                </div>

                <h3 className={`mt-5 text-3xl font-bold ${card.valueColor}`}>
                  {card.value}
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Search and Filters */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Find Products
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and organize your inventory
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <label htmlFor="search" className="mb-2 block text-sm font-semibold text-slate-700">
                Search Products
              </label>
              <input
                id="search"
                type="search"
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearch(value);
                  setPage(1);
                  updateUrl(1, pageSize, value);
                }}
                placeholder="Search by name or category..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(event) => {
                  const value = event.target.value;
                  setCategory(value);
                  setPage(1);
                  updateUrl(1, pageSize, search, value);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All Categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="mb-2 block text-sm font-semibold text-slate-700">
                Sort By
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(event) => {
                  const value = event.target.value;
                  setSort(value);
                  setPage(1);
                  updateUrl(1, pageSize, search, category, value);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Default</option>
                <option value="title-asc">Title: A → Z</option>
                <option value="title-desc">Title: Z → A</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="rating-desc">Rating: High → Low</option>
                <option value="rating-asc">Rating: Low → High</option>
              </select>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                📋 Products
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {total} products found
              </p>
            </div>
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Inventory Management
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 p-4 md:hidden">
            {displayedProducts.length === 0 ? (
              <p className="py-10 text-center text-slate-500">
                No products found.
              </p>
            ) : (
              displayedProducts.map((product) => (
                <div key={product.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="h-16 w-16 rounded-xl bg-slate-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {product.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        ID: {product.id}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-500">Price</p>
                      <p className="font-semibold text-slate-900">${product.price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Rating</p>
                      <p className="font-semibold text-slate-900">⭐ {product.rating}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Stock</p>
                      <p className={`font-semibold ${product.stock <= 10 ? "text-red-600" : "text-slate-900"}`}>
                        {product.stock}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="rounded-lg border border-slate-200 px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/products/${product.id}/edit`)}
                      className="rounded-lg bg-blue-600 px-2 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="rounded-lg border border-red-200 px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[750px]">
              <thead className="bg-slate-50">
                <tr>
                  {["Product", "Category", "Price", "Rating", "Stock", "Actions"].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((product) => (
                    <tr key={product.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-12 w-12 rounded-xl bg-slate-100 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {product.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              ID: {product.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {product.category}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        ${product.price}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        ⭐ {product.rating}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.stock <= 10 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {product.stock}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/products/${product.id}`)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/products/${product.id}/edit`)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-slate-500">
                Products per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setPageSize(value);
                  setPage(1);
                  updateUrl(1, value);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const value = Math.max(1, page - 1);
                  setPage(value);
                  updateUrl(value, pageSize);
                }}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <span className="px-2 text-sm font-medium text-slate-600">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => {
                  const value = Math.min(totalPages, page + 1);
                  setPage(value);
                  updateUrl(value, pageSize);
                }}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-slate-400">
          Product Admin Dashboard · Inventory Management
        </footer>
      </div>
    </main>
  );
}
