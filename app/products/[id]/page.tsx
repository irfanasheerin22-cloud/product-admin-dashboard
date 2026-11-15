
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductById } from "@/api/productService";
import { Product } from "@/types/product";
import {
  getLocalProducts,
  getProductOverrides,
} from "@/utils/localProducts";

export default function ViewProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const localProduct = getLocalProducts().find(
          (item) => item.id === id
        );

        if (localProduct) {
          setProduct(localProduct);
          return;
        }

        const overrides = getProductOverrides();
        const savedProduct = overrides[String(id)];

        if (savedProduct) {
          setProduct(savedProduct);
          return;
        }

        const response = await getProductById(id);
        setProduct(response as Product);
      } catch (err) {
        console.error("View product error:", err);
        setError("Unable to load product details.");
      } finally {
        setLoading(false);
      }
    };

    if (Number.isFinite(id)) {
      loadProduct();
    } else {
      setError("Invalid product ID.");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <div className="p-8">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error || "Product not found."}</p>
        <button
          onClick={() => router.push("/products")}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <button
          onClick={() => router.push("/products")}
          className="mb-6 text-blue-600"
        >
          ← Back to Products
        </button>

        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Product Details
        </h1>

        {product.thumbnail && (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="mb-6 h-56 w-full rounded-lg object-contain"
          />
        )}

        <div className="space-y-4 text-gray-800">
          <p><strong>Product Name:</strong> {product.title}</p>
          <p><strong>Price:</strong> ${product.price}</p>
          <p><strong>Stock:</strong> {product.stock}</p>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Description:</strong> {product.description}</p>
        </div>

        <button
          onClick={() => router.push(`/products/${id}/edit`)}
          className="mt-8 rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Edit Product
        </button>
      </div>
    </div>
  );
}
