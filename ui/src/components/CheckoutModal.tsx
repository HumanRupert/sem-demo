"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  CreditCard,
  Package,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

type CheckoutStep = "shipping" | "payment" | "confirmation";

interface ShippingInfo {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export function CheckoutModal() {
  const { isCheckoutOpen, closeCheckout, items, totalPrice, clearCart } =
    useCart();
  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const [orderNumber, setOrderNumber] = useState("");

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock order number
    setOrderNumber(`AB-${Date.now().toString(36).toUpperCase()}`);
    setIsProcessing(false);
    setStep("confirmation");
  };

  const handleClose = () => {
    if (step === "confirmation") {
      clearCart();
      setStep("shipping");
      setShippingInfo({
        email: "",
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "United States",
      });
    }
    closeCheckout();
  };

  const steps = [
    { key: "shipping", label: "Shipping", icon: Package },
    { key: "payment", label: "Payment", icon: CreditCard },
    { key: "confirmation", label: "Confirmation", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Checkout</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {steps.map((s, index) => (
                  <div key={s.key} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                        index <= currentStepIndex
                          ? "bg-black text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <s.icon className="w-5 h-5" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-12 md:w-20 h-0.5 mx-2 transition-colors ${
                          index < currentStepIndex
                            ? "bg-black"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {step === "shipping" && (
                  <motion.form
                    key="shipping"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleShippingSubmit}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-medium mb-4">
                      Shipping Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={shippingInfo.email}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.firstName}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              firstName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.lastName}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              lastName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.address}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        placeholder="123 Main St"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.city}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              city: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.state}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              state: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.zip}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              zip: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-6"
                    >
                      Continue to Payment
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.form>
                )}

                {step === "payment" && (
                  <motion.form
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handlePaymentSubmit}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-medium mb-4">
                      Payment Information
                    </h3>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-gray-600">
                        This is a demo. No real payment will be processed.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="123"
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Shipping</span>
                        <span>Free</span>
                      </div>
                      <div className="flex justify-between text-sm mb-4">
                        <span className="text-gray-600">Tax</span>
                        <span>{formatPrice(totalPrice * 0.08)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold border-t pt-4">
                        <span>Total</span>
                        <span>{formatPrice(totalPrice * 1.08)}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Place Order
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}

                {step === "confirmation" && (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        damping: 15,
                        stiffness: 200,
                        delay: 0.2,
                      }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <Check className="w-10 h-10 text-green-600" />
                    </motion.div>

                    <h3 className="text-2xl font-semibold mb-2">
                      Order Confirmed!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Thank you for your purchase
                    </p>

                    <div className="bg-gray-50 rounded-xl p-6 text-left max-w-sm mx-auto">
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-600">Order Number</span>
                        <span className="font-mono font-medium">
                          {orderNumber}
                        </span>
                      </div>
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-600">Items</span>
                        <span>{items.length}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatPrice(totalPrice * 1.08)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mt-6">
                      A confirmation email has been sent to{" "}
                      <span className="font-medium">{shippingInfo.email}</span>
                    </p>

                    <button
                      onClick={handleClose}
                      className="mt-8 px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
