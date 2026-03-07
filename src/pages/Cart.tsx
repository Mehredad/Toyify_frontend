import React, { useState, useEffect } from "react";
import { Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface CartItem {
  _id: string;
  id: string;
  fileName: string;
  imageVersion: "generated" | "original";
  size: number;
  quantity: number;
  price: number;
  description?: string;
}

const ShoppingCart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCart = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch cart");

        const data = await res.json();

        const normalizedItems = (data.items || []).map((item: CartItem) => ({
          ...item,
          id: item._id,
        }));

        setCartItems(normalizedItems);
        setSelectedItems(new Set(normalizedItems.map((i) => i.id)));
      } catch (err) {
        console.error("Cart fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [token]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price ?? 0) * item.quantity,
    0
  );
  const shipping = 0;
  const total = subtotal + shipping;

  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const openDeleteConfirm = (item: CartItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const removeItem = async () => {
    if (!token || !itemToDelete) return;

    try {
      setLoading(true);

      await fetch(`${import.meta.env.VITE_API_URL}/api/cart/${itemToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedCart = cartItems.filter((item) => item.id !== itemToDelete.id);
      setCartItems(updatedCart);

      const newSelected = new Set(selectedItems);
      newSelected.delete(itemToDelete.id);
      setSelectedItems(newSelected);
    } catch (err) {
      console.error("Remove item error:", err);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCheckout = () => {
    if (!termsAccepted || cartItems.length === 0) return;

    const selectedCartItems = cartItems.filter((item) =>
      selectedItems.has(item.id)
    );

    navigate("/checkout", { state: { cartItems: selectedCartItems } });
  };

  return (
    <>
      <div className="min-h-screen p-4 md:p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#42307D] mb-6 md:mb-8">
            Cart
          </h1>

          {loading && <p className="mb-4 text-gray-500">Loading...</p>}

          {cartItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500 text-lg">Your cart is empty</p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 px-6 py-2 bg-[#7F56D9] text-white font-medium rounded-md hover:bg-[#6941C6] transition-colors"
              >
                Go back to add items
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cart */}
              <div className="md:hidden space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 flex-shrink-0"
                        />
                        <p className="font-medium text-gray-900 break-words">
                          {item.fileName}
                        </p>
                      </div>

                      <button
                        onClick={() => openDeleteConfirm(item)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                        type="button"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="text-sm text-gray-600">
                      Version: {item.imageVersion}
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Price:</span>
                      <span className="font-medium">
                        £{(item.price ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Quantity:</span>
                      <span>{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Cart */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="grid grid-cols-12 gap-4 p-4 bg-[#F9F5FF] border-b text-sm font-medium text-[#667085]">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.size === cartItems.length &&
                        cartItems.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-3">File</div>
                  <div className="col-span-2">Version</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2"></div>
                </div>

                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 p-4 border-b items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="col-span-3 text-sm text-gray-900 break-words">
                      {item.fileName}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">
                      {item.imageVersion}
                    </div>
                    <div className="col-span-2 text-sm font-medium text-gray-900">
                      £{(item.price ?? 0).toFixed(2)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-900">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => openDeleteConfirm(item)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        type="button"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom section */}
              <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{" "}
                    <a href="/terms" className="text-indigo-600 hover:underline">
                      terms of service
                    </a>
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={!termsAccepted || cartItems.length === 0 || loading}
                  className="px-6 py-2.5 bg-[#7F56D9] text-white font-medium rounded-md hover:bg-[#6941C6] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Checkout <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Totals */}
              <div className="mt-6 text-right">
                <p className="text-gray-700">Subtotal: £{subtotal.toFixed(2)}</p>
                <p className="text-gray-700">
                  Shipping: {shipping === 0 ? "Free" : `£${shipping.toFixed(2)}`}
                </p>
                <p className="font-bold text-gray-900">
                  Total: £{total.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove item?"
        description={
          itemToDelete
            ? `Are you sure you want to remove "${itemToDelete.fileName}" from your cart?`
            : "Are you sure you want to remove this item from your cart?"
        }
        confirmText="Remove"
        cancelText="Cancel"
        destructive
        onConfirm={removeItem}
      />
    </>
  );
};

export default ShoppingCart;