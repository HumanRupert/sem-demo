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
  Lock,
  Shield,
  Truck,
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
    setOrderNumber(`ORD-${Date.now().toString(36).toUpperCase()}`);
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
    { key: "confirmation", label: "Done", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const taxAmount = totalPrice * 0.08;
  const finalTotal = totalPrice + taxAmount;

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Secure Checkout</h2>
                  <p className="text-xs text-gray-500">Demo Mode - No real charges</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-3 border-b bg-white">
              <div className="flex items-center justify-center gap-1">
                {steps.map((s, index) => (
                  <div key={s.key} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                          index < currentStepIndex
                            ? "bg-green-500 text-white"
                            : index === currentStepIndex
                            ? "bg-black text-white ring-4 ring-black/10"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {index < currentStepIndex ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm font-medium hidden sm:block ${
                        index <= currentStepIndex ? "text-gray-900" : "text-gray-400"
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-8 sm:w-16 h-0.5 mx-2 transition-colors rounded-full ${
                          index < currentStepIndex
                            ? "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col lg:flex-row min-h-full">
                {/* Main Form Area */}
                <div className="flex-1 p-6">
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
                        <div className="flex items-center gap-2 mb-4">
                          <Truck className="w-5 h-5 text-gray-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Shipping Information
                          </h3>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email Address
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
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
                            placeholder="you@example.com"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
                              placeholder="Doe"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Street Address
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
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
                            placeholder="123 Main Street"
                          />
                        </div>

                        <div className="grid grid-cols-6 gap-4">
                          <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
                              placeholder="San Francisco"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
                              placeholder="CA"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              ZIP Code
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
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
                              placeholder="94102"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 mt-6 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20"
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
                        <div className="flex items-center gap-2 mb-4">
                          <CreditCard className="w-5 h-5 text-gray-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Payment Details
                          </h3>
                        </div>

                        {/* Credit Card Visual */}
                        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-6 text-white mb-6 shadow-xl">
                          <div className="flex justify-between items-start mb-8">
                            <div className="w-12 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md" />
                            <span className="text-xs uppercase tracking-wider opacity-80">Demo Card</span>
                          </div>
                          <div className="font-mono text-lg tracking-widest mb-4 opacity-90">
                            4242 •••• •••• 4242
                          </div>
                          <div className="flex justify-between text-sm">
                            <div>
                              <p className="text-xs opacity-60 uppercase">Cardholder</p>
                              <p className="font-medium">{shippingInfo.firstName || 'YOUR'} {shippingInfo.lastName || 'NAME'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs opacity-60 uppercase">Expires</p>
                              <p className="font-medium">12/28</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Card Number
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="4242 4242 4242 4242"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Expiration Date
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="MM / YY"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Security Code
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="CVC"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 font-mono"
                            />
                          </div>
                        </div>

                        {/* Security badges */}
                        <div className="flex items-center justify-center gap-4 py-3 text-gray-400">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Lock className="w-3.5 h-3.5" />
                            <span>256-bit SSL</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Secure Payment</span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              Pay {formatPrice(finalTotal)}
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
                        className="text-center py-8 px-4"
                      >
                        {/* Success animation */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            damping: 15,
                            stiffness: 200,
                            delay: 0.2,
                          }}
                          className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, type: "spring" }}
                          >
                            <Check className="w-12 h-12 text-white" strokeWidth={3} />
                          </motion.div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Order Confirmed!
                          </h3>
                          <p className="text-gray-500 mb-8">
                            Thank you for your purchase
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 text-left max-w-sm mx-auto border border-gray-100"
                        >
                          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                            <span className="text-sm text-gray-500">Order Number</span>
                            <span className="font-mono font-bold text-gray-900 bg-white px-3 py-1 rounded-lg">
                              {orderNumber}
                            </span>
                          </div>
                          <div className="flex justify-between mb-3">
                            <span className="text-sm text-gray-500">Items</span>
                            <span className="font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex justify-between mb-3">
                            <span className="text-sm text-gray-500">Shipping</span>
                            <span className="font-medium text-green-600">Free</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                            <span>Total Paid</span>
                            <span className="text-green-600">{formatPrice(finalTotal)}</span>
                          </div>
                        </motion.div>

                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-sm text-gray-400 mt-6"
                        >
                          Confirmation sent to{" "}
                          <span className="font-medium text-gray-600">{shippingInfo.email}</span>
                        </motion.p>

                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          onClick={handleClose}
                          className="mt-8 px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg shadow-black/10 hover:shadow-xl"
                        >
                          Continue Shopping
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Order Summary Sidebar - visible on shipping/payment steps */}
                {step !== "confirmation" && (
                  <div className="w-full lg:w-80 bg-gray-50 border-t lg:border-t-0 lg:border-l p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Order Summary</h4>

                    {/* Cart items */}
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.variantId} className="flex gap-3 bg-white p-2 rounded-lg">
                          {item.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-md bg-gray-100" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium">{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Shipping</span>
                        <span className="font-medium text-green-600">Free</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax (8%)</span>
                        <span className="font-medium">{formatPrice(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>{formatPrice(finalTotal)}</span>
                      </div>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Shield className="w-4 h-4" />
                        <span>Secure checkout powered by demo</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Truck className="w-4 h-4" />
                        <span>Free shipping on all orders</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
