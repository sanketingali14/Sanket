/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingCart, Trash2, Plus, Minus, X, CheckCircle2, 
  ShoppingBag, LayoutDashboard, Store, Package, 
  TrendingUp, DollarSign, PlusCircle, Image as ImageIcon,
  ChevronRight, ArrowLeft, Heart, User, Download, RotateCcw, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Returned';
}

interface Coupon {
  code: string;
  discount: number; // percentage
  isActive: boolean;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: "Premium Wireless Headphones", price: 12999, image: "https://picsum.photos/seed/headphones/400/400", category: "Electronics" },
  { id: 2, name: "Minimalist Leather Watch", price: 4500, image: "https://picsum.photos/seed/watch/400/400", category: "Accessories" },
  { id: 3, name: "Smart Fitness Tracker", price: 2999, image: "https://picsum.photos/seed/tracker/400/400", category: "Electronics" },
  { id: 4, name: "Ergonomic Coffee Mug", price: 899, image: "https://picsum.photos/seed/mug/400/400", category: "Home" },
  { id: 5, name: "Organic Cotton T-Shirt", price: 1200, image: "https://picsum.photos/seed/tshirt/400/400", category: "Apparel" },
];

export default function App() {
  // App State
  const [view, setView] = useState<'shop' | 'admin' | 'wishlist' | 'my-orders'>('shop');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([
    { code: 'WELCOME10', discount: 10, isActive: true }
  ]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  
  // Admin Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Admin/Revenue State
  const [revenue, setRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    image: ''
  });

  // New Coupon Form State
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: ''
  });

  // Derived Values
  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return (subtotal * appliedCoupon.discount) / 100;
  }, [subtotal, appliedCoupon]);
  const cartTotal = subtotal - discountAmount;

  // Actions
  const addToCart = (product: Product) => {
    setIsCartBouncing(true);
    setTimeout(() => setIsCartBouncing(false), 300);
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const checkout = () => {
    if (cart.length === 0) return;
    
    const orderTotal = cartTotal;
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: new Date().toLocaleString(),
      items: [...cart],
      total: orderTotal,
      status: 'Pending'
    };

    setOrders(prev => [newOrder, ...prev]);
    setRevenue(prev => prev + orderTotal);
    setTotalOrders(prev => prev + 1);
    
    setShowCheckoutSuccess(true);
    setCart([]);
    setTimeout(() => {
      setShowCheckoutSuccess(false);
      setIsCartOpen(false);
    }, 3000);
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    const product: Product = {
      id: Date.now(),
      name: newProduct.name,
      price: Number(newProduct.price),
      category: newProduct.category,
      image: newProduct.image || `https://picsum.photos/seed/${Date.now()}/400/400`
    };

    setProducts(prev => [product, ...prev]);
    setNewProduct({ name: '', price: '', category: 'Electronics', image: '' });
  };

  const deleteProduct = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleApplyCoupon = () => {
    const coupon = coupons.find(c => c.code.toUpperCase() === couponInput.toUpperCase() && c.isActive);
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Invalid or inactive coupon code');
    }
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount) return;
    
    const coupon: Coupon = {
      code: newCoupon.code.toUpperCase(),
      discount: Number(newCoupon.discount),
      isActive: true
    };
    
    setCoupons(prev => [...prev, coupon]);
    setNewCoupon({ code: '', discount: '' });
  };

  const toggleCouponStatus = (code: string) => {
    setCoupons(prev => prev.map(c => 
      c.code === code ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const deleteCoupon = (code: string) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
  };

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const downloadInvoice = (order: Order) => {
    const invoiceContent = `
SWIFTCART INVOICE
Order ID: ${order.id}
Date: ${order.date}
Status: ${order.status}

ITEMS:
${order.items.map(item => `- ${item.name} x${item.quantity}: ₹${(item.price * item.quantity).toLocaleString()}`).join('\n')}

TOTAL: ₹${order.total.toLocaleString()}

Thank you for shopping with SwiftCart!
    `.trim();

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.id === 'Sanket123' && loginForm.password === 'Sanket@959595') {
      setIsAdminAuthenticated(true);
      setLoginError('');
      setLoginForm({ id: '', password: '' });
    } else {
      setLoginError('Invalid Admin ID or Password');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Navigation Rail / Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <ShoppingBag size={22} />
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:block">SwiftCart</span>
            </div>
            
            <nav className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              <button
                onClick={() => setView('shop')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === 'shop' ? 'bg-white text-emerald-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Store size={16} />
                <span className="hidden md:inline">Shop</span>
              </button>
              <button
                onClick={() => setView('admin')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === 'admin' ? 'bg-white text-emerald-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <LayoutDashboard size={16} />
                <span className="hidden md:inline">Admin</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setView('wishlist')}
              className={`relative p-2.5 rounded-full transition-colors group ${
                view === 'wishlist' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-neutral-100 text-neutral-600'
              }`}
            >
              <Heart size={22} className={wishlist.length > 0 ? 'fill-emerald-600 text-emerald-600' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setView('my-orders')}
              className={`p-2.5 rounded-full transition-colors ${
                view === 'my-orders' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-neutral-100 text-neutral-600'
              }`}
            >
              <User size={22} />
            </button>

            {view === 'shop' && (
              <motion.button
                onClick={() => setIsCartOpen(true)}
                animate={isCartBouncing ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
                className="relative p-2.5 hover:bg-neutral-100 rounded-full transition-colors group"
              >
                <ShoppingCart size={22} className="text-neutral-600 group-hover:text-emerald-600" />
                {cartCount > 0 && (
                  <motion.span 
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'shop' ? (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold tracking-tight">Discover Products</h2>
                  <p className="text-neutral-500 mt-1">Handpicked quality items for your lifestyle.</p>
                  
                  <div className="mt-6 relative max-w-md">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 bg-white px-4 py-2 rounded-full border border-neutral-200 h-fit">
                  <Package size={16} className="text-emerald-600" />
                  {filteredProducts.length} Items Found
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:shadow-neutral-200/50 transition-all group"
                    >
                      <div className="aspect-[4/5] overflow-hidden relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-600 border border-neutral-200/50">
                            {product.category}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full border border-neutral-200/50 text-neutral-400 hover:text-red-500 transition-colors shadow-sm"
                        >
                          <Heart size={18} className={wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''} />
                        </button>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-emerald-700 transition-colors">{product.name}</h3>
                        <div className="flex items-center justify-between mt-6">
                          <div className="flex flex-col">
                            <span className="text-xs text-neutral-400 font-medium uppercase tracking-tighter">Price</span>
                            <span className="text-xl font-bold text-neutral-900">₹{product.price.toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="bg-neutral-900 text-white p-3 rounded-2xl hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-neutral-200"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-400 gap-4">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                      <Package size={32} />
                    </div>
                    <p className="text-lg font-medium">No products match your search</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-emerald-600 font-bold hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : view === 'wishlist' ? (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">My Wishlist</h2>
                  <p className="text-neutral-500 mt-1">Items you've saved for later.</p>
                </div>
                <button
                  onClick={() => setView('shop')}
                  className="flex items-center gap-2 text-emerald-600 font-bold hover:underline"
                >
                  <ArrowLeft size={18} />
                  Back to Shop
                </button>
              </div>

              {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.filter(p => wishlist.includes(p.id)).map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      className="bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-xl transition-all group"
                    >
                      <div className="aspect-[4/5] overflow-hidden relative">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-4 right-4 p-2 bg-white rounded-full border border-neutral-200 text-red-500 shadow-sm"
                        >
                          <Heart size={18} className="fill-red-500" />
                        </button>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                        <div className="flex items-center justify-between mt-6">
                          <span className="text-xl font-bold text-neutral-900">₹{product.price.toLocaleString()}</span>
                          <button
                            onClick={() => addToCart(product)}
                            className="bg-neutral-900 text-white p-3 rounded-2xl hover:bg-emerald-600 transition-all"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-4">
                  <div className="w-20 h-20 bg-neutral-50 rounded-3xl flex items-center justify-center">
                    <Heart size={40} />
                  </div>
                  <p className="text-lg font-medium">Your wishlist is empty</p>
                  <button onClick={() => setView('shop')} className="bg-neutral-900 text-white px-6 py-3 rounded-2xl font-bold">
                    Browse Products
                  </button>
                </div>
              )}
            </motion.div>
          ) : view === 'my-orders' ? (
            <motion.div
              key="my-orders"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">My Orders</h2>
                  <p className="text-neutral-500 mt-1">Track and manage your purchases.</p>
                </div>
                <button
                  onClick={() => setView('shop')}
                  className="flex items-center gap-2 text-emerald-600 font-bold hover:underline"
                >
                  <ArrowLeft size={18} />
                  Back to Shop
                </button>
              </div>

              <div className="space-y-6">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
                      <div className="p-6 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400">
                            <Package size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Order ID</p>
                            <p className="font-mono text-sm font-bold text-emerald-700">{order.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Date</p>
                            <p className="text-sm font-medium">{order.date}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total</p>
                            <p className="text-sm font-bold">₹{order.total.toLocaleString()}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'Returned' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex -space-x-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                              <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-600">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => downloadInvoice(order)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold hover:bg-neutral-50 transition-all shadow-sm"
                          >
                            <Download size={16} />
                            Invoice
                          </button>
                          {order.status === 'Delivered' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Returned')}
                              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-all shadow-sm"
                            >
                              <RotateCcw size={16} />
                              Return
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-4">
                    <div className="w-20 h-20 bg-neutral-50 rounded-3xl flex items-center justify-center">
                      <ShoppingBag size={40} />
                    </div>
                    <p className="text-lg font-medium">You haven't placed any orders yet</p>
                    <button onClick={() => setView('shop')} className="bg-neutral-900 text-white px-6 py-3 rounded-2xl font-bold">
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : !isAdminAuthenticated ? (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto mt-12"
            >
              <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                    <LayoutDashboard size={32} />
                  </div>
                  <h2 className="text-2xl font-bold">Admin Login</h2>
                  <p className="text-neutral-500 text-sm mt-1 text-center">Please enter your credentials to access store management.</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Admin ID</label>
                    <input
                      type="text"
                      value={loginForm.id}
                      onChange={e => setLoginForm({ ...loginForm, id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                      placeholder="Enter ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Password</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                      placeholder="Enter Password"
                      required
                    />
                  </div>
                  
                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100"
                    >
                      {loginError}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-lg shadow-neutral-200 mt-4"
                  >
                    Login to Dashboard
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Store Management</h2>
                  <div className="text-sm text-neutral-500">Real-time store analytics</div>
                </div>
                <button
                  onClick={handleAdminLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
                >
                  Logout
                </button>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Total Revenue</p>
                      <h3 className="text-2xl font-bold">₹{revenue.toLocaleString()}</h3>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-2/3" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Total Items</p>
                      <h3 className="text-2xl font-bold">{products.length}</h3>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-1/2" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                      <ShoppingBag size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Total Orders</p>
                      <h3 className="text-2xl font-bold">{totalOrders}</h3>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-1/3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Product Form */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <PlusCircle size={20} className="text-emerald-600" />
                      <h3 className="text-lg font-bold">Add New Product</h3>
                    </div>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      {/* ... form fields ... */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Product Name</label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                          placeholder="e.g. Wireless Mouse"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Price (₹)</label>
                        <input
                          type="number"
                          value={newProduct.price}
                          onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Category</label>
                        <select
                          value={newProduct.category}
                          onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm appearance-none bg-white"
                        >
                          <option>Electronics</option>
                          <option>Accessories</option>
                          <option>Home</option>
                          <option>Apparel</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Image URL (Optional)</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={newProduct.image}
                            onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                            placeholder="https://..."
                          />
                          <ImageIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-lg shadow-emerald-100 mt-4"
                      >
                        Create Listing
                      </button>
                    </form>
                  </div>

                  {/* Add Coupon Form */}
                  <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <PlusCircle size={20} className="text-blue-600" />
                      <h3 className="text-lg font-bold">Create Coupon</h3>
                    </div>
                    <form onSubmit={handleAddCoupon} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Coupon Code</label>
                        <input
                          type="text"
                          value={newCoupon.code}
                          onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                          placeholder="e.g. SAVE20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Discount (%)</label>
                        <input
                          type="number"
                          value={newCoupon.discount}
                          onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                          placeholder="e.g. 20"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-100 mt-4"
                      >
                        Add Coupon
                      </button>
                    </form>
                  </div>
                </div>

                {/* Inventory & Coupons List */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                      <h3 className="font-bold">Active Inventory</h3>
                      <span className="text-xs text-neutral-400 font-medium">{products.length} Items Total</span>
                    </div>
                    {/* ... inventory list ... */}
                    <div className="divide-y divide-neutral-100 max-h-[400px] overflow-y-auto">
                      {products.map(product => (
                        <div key={product.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-100">
                              <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{product.name}</h4>
                              <p className="text-xs text-neutral-400">{product.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <span className="font-bold text-sm">₹{product.price.toLocaleString()}</span>
                            <button 
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                      <h3 className="font-bold">Manage Coupons</h3>
                      <span className="text-xs text-neutral-400 font-medium">{coupons.length} Active Coupons</span>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {coupons.map(coupon => (
                        <div key={coupon.code} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xs">
                              %
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{coupon.code}</h4>
                              <p className="text-xs text-neutral-400">{coupon.discount}% Discount</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => toggleCouponStatus(coupon.code)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                coupon.isActive 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                  : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                              }`}
                            >
                              {coupon.isActive ? 'Active' : 'Inactive'}
                            </button>
                            <button 
                              onClick={() => deleteCoupon(coupon.code)}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order History Section */}
              <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="font-bold">Order History</h3>
                  <span className="text-xs text-neutral-400 font-medium">{orders.length} Orders Recorded</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-100">
                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Order ID</th>
                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Date</th>
                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Items</th>
                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {orders.length > 0 ? (
                        orders.map((order) => (
                          <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="p-4 text-sm font-mono text-emerald-700 font-medium">{order.id}</td>
                            <td className="p-4 text-sm text-neutral-600">{order.date}</td>
                            <td className="p-4 text-sm text-neutral-600">
                              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                            </td>
                            <td className="p-4 text-sm">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none transition-all ${
                                  order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Returned">Returned</option>
                              </select>
                            </td>
                            <td className="p-4 text-sm font-bold text-neutral-900 text-right">
                              ₹{order.total.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-neutral-400 text-sm">
                            No orders have been placed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cart Sidebar (Same as before but with slightly refined styles) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} className="text-neutral-500" />
                  <h2 className="text-lg font-bold">Your Cart</h2>
                  <span className="bg-neutral-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-neutral-600">
                    {cartCount} ITEMS
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-4">
                    <div className="w-20 h-20 bg-neutral-50 rounded-3xl flex items-center justify-center">
                      <ShoppingBag size={40} />
                    </div>
                    <p className="text-sm font-medium">Your cart is empty</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="text-emerald-600 font-bold text-sm hover:underline"
                    >
                      Start shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {cart.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex gap-4 group"
                        >
                          <div className="w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-neutral-100">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <h4 className="font-semibold text-sm leading-tight group-hover:text-emerald-700 transition-colors">{item.name}</h4>
                              <p className="text-emerald-700 font-bold text-sm mt-1">₹{item.price.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="p-1.5 hover:bg-white transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="px-3 text-xs font-bold w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="p-1.5 hover:bg-white transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-neutral-400 p-2 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Coupon Section */}
                    <div className="mt-8 pt-8 border-t border-neutral-100">
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Have a coupon?</h4>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700">{appliedCoupon.code} Applied</span>
                            <span className="text-xs text-emerald-600">({appliedCoupon.discount}% OFF)</span>
                          </div>
                          <button 
                            onClick={() => setAppliedCoupon(null)}
                            className="text-emerald-700 hover:text-emerald-900"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={couponInput}
                              onChange={(e) => setCouponInput(e.target.value)}
                              placeholder="Enter code"
                              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <button
                              onClick={handleApplyCoupon}
                              className="bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                            >
                              Apply
                            </button>
                          </div>
                          {couponError && <p className="text-red-500 text-[10px] font-medium ml-1">{couponError}</p>}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 border-t border-neutral-100 bg-neutral-50/50">
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Subtotal</span>
                      <span className="font-medium text-neutral-900">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-emerald-600 font-medium">
                        <span>Discount ({appliedCoupon.discount}%)</span>
                        <span>-₹{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Shipping</span>
                      <span className="text-emerald-600 font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-4 border-t border-neutral-200">
                      <span>Total</span>
                      <span>₹{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={checkout}
                    disabled={showCheckoutSuccess}
                    className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-bold hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:bg-emerald-600 disabled:opacity-100 flex items-center justify-center gap-3 shadow-xl shadow-neutral-200"
                  >
                    {showCheckoutSuccess ? (
                      <>
                        <CheckCircle2 size={22} />
                        <span>Order Confirmed</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Purchase</span>
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showCheckoutSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-neutral-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 font-bold border border-white/10"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            Order processed successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
