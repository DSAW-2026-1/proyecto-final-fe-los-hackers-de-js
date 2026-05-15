import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar } from './ui/avatar'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select'
import { Loader2, Package, ChevronLeft, MessageCircle } from 'lucide-react'
import { productService, ShippingResponseItem, Product } from '../services/productService'
import { userService, UserProfileResponse } from '../services/userService'
import { toast } from 'sonner'
import Base64ImageLoader from "./Base64ImageLoader.tsx";

export function SellerShippingUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState<ShippingResponseItem | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [buyer, setBuyer] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const shippingData = await productService.getShippingDetail(id);
        const normalizedShipping = {
          ...shippingData,
          status: normalizeStatus(shippingData.status)
        };
        setShipping(normalizedShipping);

        const [productData, buyerData] = await Promise.all([
          productService.getProduct(shippingData.productID),
          userService.getProfileByUid(shippingData.buyerID!)
        ]);

        setProduct(productData);
        setBuyer(buyerData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('No se pudo cargar la información del envío');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  function getStatusBadge(status: string) {
    const s = status.toLowerCase();
    const baseClasses = "gap-1.5 py-1 px-3 text-sm";
    
    if (s.includes('delivered') || s.includes('entregado')) 
      return <Badge variant="default" className={`${baseClasses} bg-green-600`}>Entregado</Badge>;
    if (s.includes('in transit') || s.includes('tránsito') || s.includes('transito') || s.includes('enviado') || s.includes('shipped')) 
      return <Badge variant="default" className={baseClasses}>En tránsito</Badge>;
    if (s.includes('confirmed') || s.includes('confirmado')) 
      return <Badge variant="secondary" className={baseClasses}>Confirmado</Badge>;
    if (s.includes('pending') || s.includes('pendiente')) 
      return <Badge variant="outline" className={baseClasses}>Pendiente</Badge>;
    if (s.includes('cancelled') || s.includes('cancelado') || s.includes('rechazado')) 
      return <Badge variant="destructive" className={baseClasses}>Cancelado</Badge>;
    
    return <Badge variant="outline" className={baseClasses}>{status}</Badge>;
  }

  // Normalizes status to English canonical values for the backend
  function normalizeStatus(status: string): string {
    const s = status.toLowerCase();
    if (s.includes('delivered') || s.includes('entregado')) return 'Delivered';
    if (s.includes('in transit') || s.includes('tránsito') || s.includes('transito') || s.includes('enviado') || s.includes('shipped')) return 'In transit';
    if (s.includes('confirmed') || s.includes('confirmado')) return 'Confirmed';
    if (s.includes('pending') || s.includes('pendiente')) return 'Pending';
    if (s.includes('cancelled') || s.includes('cancelado') || s.includes('rechazado')) return 'Cancelled';
    return status;
  }

  function getProgress(status: string) {
    const s = status.toLowerCase();
    if (s.includes('delivered') || s.includes('entregado')) return 100;
    if (s.includes('in transit') || s.includes('tránsito') || s.includes('transito') || s.includes('enviado') || s.includes('shipped')) return 75;
    if (s.includes('confirmed') || s.includes('confirmado')) return 40;
    if (s.includes('pending') || s.includes('pendiente')) return 15;
    return 0;
  }

  async function handleSave() {
    if (!shipping) return;

    try {
      setSaving(true);
      await productService.updateShippingStatus(shipping.saleID, shipping.status);
      toast.success('Estado del envío actualizado correctamente');
      navigate('/seller');
    } catch (error) {
      console.error('Error updating shipping status:', error);
      toast.error('No se pudo actualizar el estado del envío');
    } finally {
      setSaving(false);
    }
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
          <Link to="/seller">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  const buyerInitials = buyer?.username?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'B';

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          className="mb-6 -ml-2 text-muted-foreground hover:text-primary transition-colors gap-2"
          onClick={() => navigate('/seller')}
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al Panel de Vendedor
        </Button>

        <header className="mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">Actualizar estado de envío</h1>
          <p className="text-sm text-muted-foreground">Gestiona el progreso de entrega para tus clientes</p>
        </header>

        <Card className="p-6">
          <div className="flex flex-col gap-8">
            <div className="w-full">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-muted overflow-hidden border">
                  {product.images?.[0] ? (
                    <Base64ImageLoader
                      data={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-primary mb-1">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                    <span>${product.price.toLocaleString('es-CO')}</span>
                    <span className="text-muted-foreground font-normal text-sm">· {shipping.amount} {shipping.amount > 1 ? 'unidades' : 'unidad'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">ID Venta: <span className="font-mono">{shipping.saleID}</span></div>
                </div>

                <div className="ml-auto flex-shrink-0 flex flex-col items-end gap-3">
                  {getStatusBadge(shipping.status)}
                  {!shipping.status.toLowerCase().includes('cancel') && !shipping.status.toLowerCase().includes('rechazado') && (
                    <div className="w-48">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full bg-primary rounded-full ${getProgress(shipping.status) < 100 ? 'animate-pulse' : ''}`} 
                          style={{ width: `${getProgress(shipping.status)}%` }} 
                        />
                      </div>
                      <p className="text-[10px] text-right text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                        Progreso: {getProgress(shipping.status)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Comprador</h3>
                  <Card className="p-4 bg-secondary/50 border-primary/10 w-full shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 shadow-sm border-2 border-background">
                          {buyer?.photo ? (
                              <Base64ImageLoader data={buyer.photo} alt={buyer.username} className="w-full h-full object-cover"/>
                          ) : (
                            <div className="w-full h-full bg-primary flex items-center justify-center text-white text-lg font-bold">
                              {buyerInitials}
                            </div>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{buyer?.username}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{buyer?.career}</p>
                          <div className="text-sm text-gray-700">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mb-1">Dirección de entrega:</p>
                            <p className="leading-tight text-sm">{shipping.shippingAddress}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-primary/10">
                        <Button variant="outline" asChild className="w-full">
                          <Link to={`/chat?user=${shipping.buyerID}`}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Enviar mensaje al comprador
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="bg-muted/20 p-6 rounded-xl border border-border/60">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Actualizar Estado</h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        Estado del Envío
                      </label>
                      <Select 
                        value={shipping.status} 
                        onValueChange={(v) => setShipping(s => s ? ({ ...s, status: v }) : null)}
                      >
                        <SelectTrigger className="bg-background border-muted-foreground/20">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pendiente</SelectItem>
                          <SelectItem value="Confirmed">Confirmado</SelectItem>
                          <SelectItem value="In transit">En tránsito</SelectItem>
                          <SelectItem value="Delivered">Entregado</SelectItem>
                          <SelectItem value="Cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Al cambiar el estado, se enviará una notificación automática al centro de mensajes del comprador.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate('/seller')}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        className="flex-1 shadow-md"
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

