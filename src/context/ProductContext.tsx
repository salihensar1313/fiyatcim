"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { Product } from "@/types";
import { getAllActiveProducts } from "@/lib/queries";
import { createProduct as apiCreateProduct, updateProduct as apiUpdateProduct, softDeleteProduct as apiSoftDeleteProduct } from "@/lib/mutations";

interface ProductContextType {
  products: Product[];
  loading: boolean;
  addProduct: (product: Omit<Product, "id" | "created_at">) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Use timestamp-based IDs instead of module-level counter (React Strict Mode safe)

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const data = await getAllActiveProducts();
      setProducts(data);
    } catch (err) {
      console.error("ProductContext load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadProducts().finally(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  }, [loadProducts]);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    await loadProducts();
  }, [loadProducts]);

  const addProduct = useCallback(async (productData: Omit<Product, "id" | "created_at">): Promise<Product | null> => {
    const { data, error } = await apiCreateProduct(productData as Parameters<typeof apiCreateProduct>[0]);
    if (error) {
      // Demo mode: in-memory fallback
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    }
    if (data) {
      setProducts((prev) => [data, ...prev]);
      return data;
    }
    return null;
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const { error } = await apiUpdateProduct(id, updates);
    if (error) {
      // Demo mode: in-memory fallback
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
        )
      );
      return;
    }
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      )
    );
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await apiSoftDeleteProduct(id);
    if (error) {
      // Demo mode: in-memory fallback
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, deleted_at: new Date().toISOString(), is_active: false } : p
        )
      );
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, deleted_at: new Date().toISOString(), is_active: false } : p
      )
    );
  }, []);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id && !p.deleted_at),
    [products]
  );

  const getProductBySlug = useCallback(
    (slug: string) => products.find((p) => p.slug === slug && !p.deleted_at),
    [products]
  );

  return (
    <ProductContext.Provider
      value={{ products, loading, addProduct, updateProduct, deleteProduct, getProductById, getProductBySlug, refreshProducts }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within a ProductProvider");
  return context;
}
