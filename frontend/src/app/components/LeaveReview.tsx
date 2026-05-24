import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Star, CheckCircle, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { productService, Product, ShippingResponseItem } from '../services/productService';
import { ApiError } from '../services/api';
import { toast } from 'sonner';
import Base64ImageLoader from './Base64ImageLoader';
import { NotFound } from './NotFound';

// Removed hardcoded ORDER constant as we are now using real data from API

const StarRating = ({
  rating,
  setRating,
  hoverRating,
  setHoverRating
}: {
  rating: number;
  setRating: (r: number) => void;
  hoverRating: number;
  setHoverRating: (r: number) => void;
}) => {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-10 h-10 ${
              star <= (hoverRating || rating)
                ? 'fill-accent text-accent'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
};
let productID = null
export function LeaveReview() {
  const { id: saleID } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState<ShippingResponseItem | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const [productRating, setProductRating] = useState(0);
  const [productHoverRating, setProductHoverRating] = useState(0);
  const [productTitle, setProductTitle] = useState('');
  const [productBody, setProductBody] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!saleID) return;
      try {
        setLoading(true);
        const shippingData = await productService.getShippingDetail(saleID);
        productID = shippingData.productID
        setShipping(shippingData);

        const productData = await productService.getProduct(shippingData.productID);
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching data for review:', error);
        toast.error('No se pudo cargar la información del pedido');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [saleID]);

  const handlePublish = async () => {
    if (!product || !productRating || !productTitle || !productBody) {
      toast.error('Por favor completa los campos obligatorios del producto (calificación, título y comentario)');
      return;
    }

    try {
      setSubmitting(true);
      await productService.createReview(productID!, {
        rating: productRating,
        title: productTitle,
        body: productBody
      });
      
      toast.success('¡Reseña publicada con éxito!');
      navigate('/orders');
    } catch (error: unknown) {
      console.error('Error creating review:', error);
      
      const errMsg = error instanceof Error ? error.message : 'Error al publicar la reseña';
      const status = (error as ApiError)?.status;

      if (status === 409 || errMsg.toLowerCase().includes('already reviewed')) {
        toast.error('Ya has calificado este producto anteriormente.');
      } else if (status === 403) {
        toast.error('Solo puedes calificar productos que hayas comprado.');
      } else {
        toast.error(errMsg || 'Error al publicar la reseña');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!shipping || !product) {
    return <NotFound />;
  }

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

  const statusBadge = badgeProps(shipping.status);

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">Calificar Compra</h1>
          <p className="text-muted-foreground">
            Comparte tu experiencia con la comunidad
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Producto Recibido</h2>

              <div className="flex gap-6 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-white flex-shrink-0 border">
                  {product.images[0] ? (
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
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="flex items-center gap-4 text-sm mt-1">
                    <span className="text-muted-foreground">Pedido: {shipping.saleID}</span>
                    <span className="text-muted-foreground">•</span>
                    <Badge {...statusBadge}>
                      {statusBadge.children}
                    </Badge>
                  </div>
                  <p className="font-bold text-primary mt-2">
                    ${product.price.toLocaleString('es-CO')} COP
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Califica el Producto</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">¿Qué tal estuvo el producto? *</Label>
                  <StarRating
                    rating={productRating}
                    setRating={setProductRating}
                    hoverRating={productHoverRating}
                    setHoverRating={setProductHoverRating}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {productRating === 0 && 'Selecciona una calificación'}
                    {productRating === 1 && 'Muy malo'}
                    {productRating === 2 && 'Malo'}
                    {productRating === 3 && 'Regular'}
                    {productRating === 4 && 'Bueno'}
                    {productRating === 5 && '¡Excelente!'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productTitle">Título de la reseña *</Label>
                  <Input
                    id="productTitle"
                    placeholder="Ej: Excelente producto, me encantó"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productReview">Cuéntanos tu experiencia con el producto *</Label>
                  <Textarea
                    id="productReview"
                    placeholder="Describe la calidad del producto, si coincidió con la descripción, estado en que llegó, etc."
                    className="min-h-32 resize-none"
                    value={productBody}
                    onChange={(e) => setProductBody(e.target.value)}
                  />
                  <p className={`text-xs ${productBody.length < 10 ? 'text-muted-foreground' : 'text-green-600'}`}>
                    {productBody.length} caracteres
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                size="lg"
                disabled={productRating === 0 || !productTitle || !productBody || submitting}
                onClick={handlePublish}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                Publicar Reseña
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                size="lg"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Resumen de tu Reseña</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Calificación del Producto</p>
                  <div className="flex items-center gap-2">
                    {productRating > 0 ? (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < productRating ? 'fill-accent text-accent' : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                        <span className="font-bold text-lg ml-2">{productRating}.0</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">No calificado</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-sm">
              <h4 className="font-semibold text-sm mb-3">Detalles del Pedido</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedido:</span>
                  <span className="font-medium">{shipping.saleID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cantidad:</span>
                  <span className="font-medium">{shipping.amount.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
