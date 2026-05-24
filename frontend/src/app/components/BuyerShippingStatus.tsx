 import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar } from './ui/avatar'
import { Star, Loader2, Package, ChevronLeft } from 'lucide-react'
import { productService, ShippingResponseItem, Product } from '../services/productService'
import { userService, UserProfileResponse } from '../services/userService'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'
 import Base64ImageLoader from "./Base64ImageLoader.tsx";

// Using same statuses and badge mapping as OrderHistory

export function BuyerShippingStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState<ShippingResponseItem | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const shippingData = await productService.getShippingDetail(id);
        setShipping(shippingData);

        const [productData, sellerData] = await Promise.all([
          productService.getProduct(shippingData.productID),
          userService.getProfileByUid(shippingData.sellerID!)
        ]);

        setProduct(productData);
        setSeller(sellerData);
      } catch (error) {
        console.error('Error fetching shipping details:', error);
        toast.error('No se pudo cargar la información del envío');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  function badgeProps(status: string) {
    const s = status.toLowerCase();
    const baseClasses = "gap-1.5 py-1 px-3 text-sm";
    if (s.includes('delivered') || s.includes('entregado')) 
      return { variant: 'default' as const, className: `${baseClasses} bg-green-600`, children: 'Entregado' }
    if (s.includes('in transit') || s.includes('tránsito') || s.includes('transito') || s.includes('enviado') || s.includes('shipped')) 
      return { variant: 'default' as const, className: baseClasses, children: 'En tránsito' }
    if (s.includes('confirmed') || s.includes('confirmado')) 
      return { variant: 'secondary' as const, className: baseClasses, children: 'Confirmado' }
    if (s.includes('pending') || s.includes('pendiente')) 
      return { variant: 'outline' as const, className: baseClasses, children: 'Pendiente' }
    if (s.includes('cancelled') || s.includes('cancelado') || s.includes('rechazado')) 
      return { variant: 'destructive' as const, className: baseClasses, children: 'Cancelado' }
    return { variant: 'default' as const, className: baseClasses, children: status }
  }

  function getProgress(status: string) {
    const s = status.toLowerCase();
    if (s.includes('delivered') || s.includes('entregado')) return 100;
    if (s.includes('in transit') || s.includes('tránsito') || s.includes('transito') || s.includes('enviado') || s.includes('shipped')) return 75;
    if (s.includes('confirmed') || s.includes('confirmado')) return 40;
    if (s.includes('pending') || s.includes('pendiente')) return 15;
    return 0;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!shipping || !product) {
    return (
      <div className="text-center py-20">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">No se encontró la información del pedido</h2>
        <Button asChild className="mt-4">
          <Link to="/orders">Volver a mis pedidos</Link>
        </Button>
      </div>
    );
  }

  const statusBadge = badgeProps(shipping.status);
  const sellerInitials = seller?.username?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          className="mb-6 -ml-2 text-muted-foreground hover:text-primary transition-colors gap-2"
          onClick={() => navigate('/orders')}
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Mis Pedidos
        </Button>

        <header className="mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">Estado de envío</h1>
          <p className="text-sm text-muted-foreground">Sigue el estado de envío de tu pedido</p>
        </header>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-stretch justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex-shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                      <Base64ImageLoader data={product.images[0]} alt={product.name} className="w-full h-full object-cover"/>
                  ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    {product.name}
                    <span className="text-lg font-semibold text-muted-foreground">
                      {` — $${product.price.toLocaleString('es-CO')} · ${shipping.amount} ${shipping.amount > 1 ? 'unidades' : 'unidad'}`}
                    </span>
                  </h2>
                  <div className="text-xs text-muted-foreground">Pedido {shipping.saleID}</div>
                  <div className="mt-2 text-sm text-gray-700">
                    <div className="text-xs text-muted-foreground">Dirección de envío: <span className="font-medium">{shipping.shippingAddress}</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 inline-block">
                <Card className="p-4 bg-secondary/50 border-primary/10 inline-block w-auto">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      {seller?.photo ? (
                          <Base64ImageLoader data={seller.photo} alt={seller.username} className="w-full h-full object-cover"/>
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center text-white text-lg font-bold">
                          {sellerInitials}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{seller?.username}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{seller?.career}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          <span className="font-medium text-foreground">{seller?.reputation ? parseFloat(seller.reputation).toFixed(1) : '0.0'}</span>
                          <span>({seller?.sales} ventas)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="w-48 sm:w-64 flex flex-col justify-between items-end gap-2">
              <div className="flex flex-col items-end gap-2">
                <Badge {...statusBadge}>
                  {statusBadge.children}
                </Badge>

                {!shipping.status.toLowerCase().includes('cancel') && !shipping.status.toLowerCase().includes('rechazado') && (
                  <div className="w-48 sm:w-64">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-2 bg-primary rounded-full ${getProgress(shipping.status) < 100 ? 'animate-pulse' : ''}`} 
                        style={{ width: `${getProgress(shipping.status)}%` }} 
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right italic">
                      {shipping.status.toLowerCase().includes('entregado') || shipping.status.toLowerCase().includes('delivered') 
                        ? '¡Pedido entregado!' 
                        : shipping.status.toLowerCase().includes('tránsito') || shipping.status.toLowerCase().includes('in transit') || shipping.status.toLowerCase().includes('enviado')
                        ? 'En camino'
                        : 'Procesando pedido'}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link to={`/product/${shipping.productID}`}>Ver producto</Link>
                </Button>

                <Button asChild variant="outline" size="sm">
                  <Link to={`/orders/${shipping.saleID}/review`}>Dejar reseña</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
