import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertTriangle, Package, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { productService, Product } from '../services/productService';
import { adminService } from '../services/adminService';
import { ApiError } from '../services/api';
import { toast } from 'sonner';
import Base64ImageLoader from './Base64ImageLoader';

export function AdminDeleteProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await productService.getProduct(id);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product for admin:', error);
        toast.error('No se pudo cargar la información del producto');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setDeleting(true);
      await adminService.deleteProduct(id);
      toast.success('Producto eliminado exitosamente');
      navigate('/admin');
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      const err = error as ApiError;
      if (err.status === 409) {
        toast.error('El producto ya ha sido eliminado');
      } else {
        toast.error(err.message || 'Error al eliminar el producto');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Producto no encontrado</h2>
        <Button onClick={() => navigate('/admin')}>Volver al Panel</Button>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Panel de Administración
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="w-8 h-8 text-destructive" />
            <h1 className="text-3xl font-bold text-primary">Moderación de Producto</h1>
          </div>
          <p className="text-muted-foreground">Elimina productos que infrinjan los términos de servicio.</p>
        </div>

        <Card className="p-8 mb-8 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
              {product.images[0] ? (
                <Base64ImageLoader data={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{product.name}</h2>
                <Badge variant={product.status === 'Available' ? 'default' : 'secondary'}>
                  {product.status === 'Available' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-xl font-bold text-primary mb-4">
                ${product.price.toLocaleString('es-CO')} COP
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">Descripción Publicada</h4>
                  <p className="text-sm line-clamp-3 italic">&quot;{product.description}&quot;</p>
                </div>
                
                <div className="flex gap-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <span className="ml-2 font-medium">{product.condition}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendedor:</span>
                    <span className="ml-2 font-medium">#{product.sellerID.substring(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 border-destructive/20 bg-destructive/5">
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-destructive mb-1">Confirmar Eliminación</h3>
              <p className="text-sm text-destructive/80">
                Esta acción eliminará permanentemente el producto del marketplace. El vendedor recibirá una notificación institucional.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/admin')} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Borrando...
                </>
              ) : (
                'Borrar Definitivamente'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
