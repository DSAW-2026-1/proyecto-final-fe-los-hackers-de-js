import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ShoppingCart, Package, CreditCard, Lock, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productService, Product } from '../services/productService';
import { userService } from '../services/userService';
import Base64ImageLoader from './Base64ImageLoader';
import PseLogo from "./../../../res/images/logo_PSE.png"

export function Checkout() {
  const { cart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cartDetails, setCartDetails] = useState<(Product & { amount: number })[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'card',
    notes: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para finalizar la compra');
      navigate('/login');
      return;
    }

    const fetchCartDetails = async () => {
      const items = Object.values(cart);
      if (items.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const details = await Promise.all(
          items.map(async (item) => {
            const product = await productService.getProduct(item.productID);
            return { ...product, amount: item.amount };
          })
        );
        setCartDetails(details);
        
        // Also fetch user profile to pre-fill email only
        const profile = await userService.getProfile();
        setFormData(prev => ({
          ...prev,
          email: profile.email
        }));
      } catch (err) {
        console.error('Error fetching checkout details:', err);
        toast.error('Error al cargar los detalles del carrito');
      } finally {
        setLoading(false);
      }
    };

    fetchCartDetails();
  }, [cart, isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (cartDetails.length === 0) return;
    
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      const productsPayload = Object.values(cart).reduce((acc, item, index) => {
        acc[index] = {
          productID: item.productID,
          amount: item.amount
        };
        return acc;
      }, {} as { [key: number]: { productID: string, amount: number } });

      const shippingAddress = formData.address;

      await productService.checkout({
        products: productsPayload,
        shippingAddress
      });

      toast.success('¡Pedido realizado con éxito!');
      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Checkout error:', err);
      try {
        const error = err as Error;
        const errorData = JSON.parse(error.message);
        toast.error(errorData.error);
      } catch {
        toast.error('Error al procesar el pedido. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartDetails.length === 0) {
    return (
      <div className="bg-muted/30 py-24 text-center">
        <div className="max-w-md mx-auto px-4">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-8">Agrega algunos productos para continuar con la compra.</p>
          <Button onClick={() => navigate('/products')}>Ver Productos</Button>
        </div>
      </div>
    );
  }

  const subtotal = cartDetails.reduce((acc, item) => acc + item.price * item.amount, 0);
  const total = subtotal;

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#002B5B] mb-2 font-display">Finalizar Compra</h1>
          <p className="text-muted-foreground">
            Completa tu información para coordinar la entrega
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-[#002B5B] flex items-center justify-center text-white font-bold shrink-0">
                  1
                </div>
                <h2 className="text-xl font-bold text-[#002B5B]">Información de Contacto</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nombre Completo *</Label>
                  <Input 
                    id="name" 
                    placeholder="Juan Pérez" 
                    className="bg-muted/20 border-transparent focus:border-primary/20 h-12"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="juan.perez@unisabana.edu.co" 
                    className="bg-muted/20 border-transparent focus:border-primary/20 h-12"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Teléfono *</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+57 300 123 4567" 
                    className="bg-muted/20 border-transparent focus:border-primary/20 h-12"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-[#002B5B] flex items-center justify-center text-white font-bold shrink-0">
                  2
                </div>
                <h2 className="text-xl font-bold text-[#002B5B]">Dirección de entrega</h2>
              </div>

              <div className="space-y-2">
                <Input 
                  id="address" 
                  placeholder="Ej: Carrera 1A #23-45 Torre 1 Apartamento 23-4, Bogotá" 
                  className="bg-muted/20 border-transparent focus:border-primary/20 h-12"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-[#002B5B] flex items-center justify-center text-white font-bold shrink-0">
                  3
                </div>
                <h2 className="text-xl font-bold text-[#002B5B]">Método de Pago</h2>
              </div>

              <RadioGroup 
                value={formData.paymentMethod} 
                onValueChange={(val) => handleRadioChange('paymentMethod', val)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-muted-foreground/10 cursor-pointer hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="card" id="card" />
                  <label htmlFor="card" className="flex items-center gap-3 font-medium cursor-pointer flex-1">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    Tarjeta de crédito/débito
                  </label>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg border border-muted-foreground/10 cursor-pointer hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="pse" id="pse" />
                  <label htmlFor="pse" className="flex items-center gap-3 font-medium cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <img src={PseLogo} alt="PSE" className="h-8 w-auto" />
                      <span>Pago por PSE</span>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold text-lg mb-6">Resumen del Pedido</h3>

              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cartDetails.map((item) => (
                  <div key={item.productID} className="flex gap-3">
                    <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                      {item.images[0] ? (
                        <Base64ImageLoader
                          data={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2 mb-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Cantidad: {item.amount}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        ${(item.price * item.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-medium text-green-600">Gratis</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <div className="text-right">
                    <span className="font-bold text-primary text-2xl">
                      ${total.toLocaleString()}
                    </span>
                    <p className="text-xs text-muted-foreground">COP</p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                size="lg"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Confirmar Pedido
                  </>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
