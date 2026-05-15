import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { productService, Product } from '../services/productService';
import { userService } from '../services/userService';
import { useNavigate } from 'react-router';
import Base64ImageLoader from './Base64ImageLoader';

interface CartProductInfo extends Product {
  cartIndex: number;
  amount: number;
}

export function ShoppingCart() {
  const { cart, removeFromCart, updateAmount, totalItems } = useCart();
  const [productDetails, setProductDetails] = useState<{ [id: string]: Product }>({});
  const [sellerNames, setSellerNames] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMissingData() {
      const cartItems = Object.values(cart);
      
      // 1. Check for missing product details
      const missingProductIds = cartItems
        .map(item => item.productID)
        .filter(id => !productDetails[id]);

      // 2. Once we have (or will have) product details, check for missing seller names
      // We can only check for seller IDs if we have the product details
      const currentProductDetails = { ...productDetails };
      
      try {
        let fetchNeeded = false;

        // Fetch products if needed
        if (missingProductIds.length > 0) {
          fetchNeeded = true;
          if (Object.keys(productDetails).length === 0) setLoading(true);
          
          await Promise.all(
            missingProductIds.map(async (id) => {
              const product = await productService.getProduct(id);
              currentProductDetails[id] = product;
            })
          );
          setProductDetails(currentProductDetails);
        }

        // Now check for missing seller names based on current + newly fetched products
        const sellerIdsToFetch = cartItems
          .map(item => currentProductDetails[item.productID]?.sellerID)
          .filter((uid): uid is string => !!uid && !sellerNames[uid]);
        
        const uniqueSellerIds = Array.from(new Set(sellerIdsToFetch));

        if (uniqueSellerIds.length > 0) {
          fetchNeeded = true;
          const newSellerNames = { ...sellerNames };
          await Promise.all(
            uniqueSellerIds.map(async (uid) => {
              try {
                const profile = await userService.getProfileByUid(uid);
                newSellerNames[uid] = profile.username;
              } catch (e) {
                console.error(`Error fetching profile for ${uid}:`, e);
                newSellerNames[uid] = uid; // Fallback
              }
            })
          );
          setSellerNames(newSellerNames);
        }

        if (!fetchNeeded && cartItems.length > 0) {
          setLoading(false);
        } else if (cartItems.length === 0) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching cart data:', error);
      } finally {
        // Only set loading false if we finished fetching everything
        // Note: The parallel fetch logic means we might need multiple turns, 
        // but setProductDetails/setSellerNames will trigger them.
      }
    }

    fetchMissingData();
  }, [cart, productDetails, sellerNames]);

  // Derive display list from cart + cached details
  const products = Object.entries(cart).map(([index, item]) => {
    const details = productDetails[item.productID];
    return details ? {
      ...details,
      productID: item.productID,
      cartIndex: parseInt(index),
      amount: item.amount
    } : null;
  }).filter((p): p is CartProductInfo => p !== null);

  const subtotal = products.reduce((acc, item) => acc + item.price * item.amount, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  if (loading && Object.keys(cart).length > 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Cargando tu carrito...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Carrito de Compras</h1>
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {products.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Tu carrito está vacío</h3>
                    <p className="text-muted-foreground mb-4">
                      Agrega productos del marketplace para comenzar
                    </p>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => navigate('/search')}
                  >
                    Explorar Productos
                  </Button>
                </div>
              </Card>
            ) : (
              products.map((item) => (
                <Card key={item.productID} className="p-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <Base64ImageLoader
                        data={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 
                            className="font-semibold text-lg mb-1 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/product/${item.productID}`)}
                          >
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Vendido por {sellerNames[item.sellerID] || item.sellerID}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {item.condition}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(item.cartIndex)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => updateAmount(item.cartIndex, item.amount - 1, item.stock)}
                            disabled={item.amount <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-medium w-8 text-center">{item.amount}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => updateAmount(item.cartIndex, item.amount + 1, item.stock)}
                            disabled={item.amount >= item.stock}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          {item.amount >= item.stock && (
                            <span className="text-[10px] text-amber-600 font-medium">Límite alcanzado</span>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            ${(item.price * item.amount).toLocaleString('es-CO')}
                          </p>
                          <p className="text-xs text-muted-foreground">COP</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}


          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold text-lg mb-6">Resumen del Pedido</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-medium text-green-600">
                    {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CO')}`}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <div className="text-right">
                    <span className="font-bold text-primary text-2xl">
                      ${total.toLocaleString('es-CO')}
                    </span>
                    <p className="text-xs text-muted-foreground">COP</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                  disabled={products.length === 0}
                  onClick={() => navigate('/checkout')}
                >
                  Proceder al Pago
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/search')}
                >
                  Continuar Comprando
                </Button>
              </div>


            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

