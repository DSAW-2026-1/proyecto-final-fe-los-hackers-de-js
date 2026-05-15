import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import {
  ShoppingCart,
  MessageCircle,
  Star,
  Shield,
  Package,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  Edit,
  Minus,
  Plus
} from 'lucide-react';
import { productService, Product, ReviewItem } from '../services/productService';
import { userService, UserProfileResponse } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { NotFound } from './NotFound';
import Base64ImageLoader from './Base64ImageLoader';
import { ApiError } from '../services/api';
import { useCallback } from 'react';

export function ProductDetail() {
  const { id: productID } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { uid } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [buyerProfiles, setBuyerProfiles] = useState<Record<string, UserProfileResponse>>({});
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  const loadReviews = useCallback(async (page: number, append: boolean = false) => {
    if (!productID) return;
    try {
      setLoadingReviews(true);
      const data = await productService.getReviews(productID, page);
      
      const reviewList = Object.values(data.results || {});
      
      // Fetch buyer profiles for new reviews
      const newProfiles: Record<string, UserProfileResponse> = {};
      await Promise.all(reviewList.map(async (review) => {
        if (!buyerProfiles[review.buyerID] && !newProfiles[review.buyerID]) {
          try {
            const profile = await userService.getProfileByUid(review.buyerID);
            newProfiles[review.buyerID] = profile;
          } catch (err) {
            console.error(`Error fetching profile for buyer ${review.buyerID}:`, err);
          }
        }
      }));

      if (Object.keys(newProfiles).length > 0) {
        setBuyerProfiles(prev => ({ ...prev, ...newProfiles }));
      }
      
      if (append) {
        setReviews(prev => [...prev, ...reviewList]);
      } else {
        setReviews(reviewList);
      }
      
      setReviewsPage(data.page);
      setReviewCount(data.count);
      setHasMoreReviews(data.page < data.pages);
    } catch (err: unknown) {
      if ((err as ApiError).status === 204) {
        setReviews([]);
        setReviewCount(0);
        setHasMoreReviews(false);
      }
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [productID, buyerProfiles]);

  useEffect(() => {
    async function fetchData() {
      if (!productID) return;
      try {
        const productData = await productService.getProduct(productID);
        setProduct(productData);
        
        // Fetch seller info
        const sellerData = await userService.getProfileByUid(productData.sellerID);
        setSeller(sellerData);

        // Fetch initial reviews
        await loadReviews(1);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productID, loadReviews]);

  const handleLoadMore = () => {
    if (hasMoreReviews && !loadingReviews) {
      loadReviews(reviewsPage + 1, true);
    }
  };

  const handleAddToCart = () => {
    if (product && productID) {
      addToCart(productID, quantity, product.stock);
    }
  };

  const incrementQty = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return <NotFound />;
  }

  const stockStatus = () => {
    if (product.stock <= 0) return { label: 'Agotado', variant: 'destructive' as const, banner: null };
    if (product.stock <= 3) return { 
      label: 'Disponible', 
      variant: 'secondary' as const, 
      banner: product.stock === 1 ? '¡Última unidad disponible!' : `¡Últimas ${product.stock} unidades disponibles!` 
    };
    return { label: 'Disponible', variant: 'secondary' as const, banner: null };
  };

  const status = stockStatus();
  const isOwner = uid === product?.sellerID;

  return (
    <div className="bg-muted/30 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          className="mb-6 -ml-2 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm border border-border">
              {product.images[selectedImage] ? (
                <Base64ImageLoader
                  data={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              {product.stock <= 3 && product.stock > 0 && (
                <Badge className="absolute top-4 left-4 bg-amber-500 hover:bg-amber-600 text-white border-none">
                  Pocas unidades
                </Badge>
              )}
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg py-1 px-4">
                    Agotado
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {Object.entries(product.images).map(([key, img]) => (
                <button 
                  key={key} 
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === parseInt(key) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'
                  }`}
                  onClick={() => setSelectedImage(parseInt(key))}
                >
                  <Base64ImageLoader
                    data={img}
                    alt={`${product.name} thumb ${key}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs uppercase tracking-wider">
                  {product.category}
                </Badge>
                <Badge variant={status.variant} className="text-xs">
                  {status.label}
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-3">
                {product.name}
              </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Publicado recientemente</span>
                    </div>
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-medium text-foreground">
                      {Number(product.rating.toFixed(1))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-bold text-primary">
                ${product.price.toLocaleString('es-CO')}
              </span>
              <span className="text-xl text-muted-foreground">COP</span>
            </div>

            {status.banner && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse">
                <Clock className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{status.banner}</p>
              </div>
            )}

            <Link to={`/profile/${product.sellerID}`} className="block">
              <Card className="p-6 bg-secondary/50 border-primary/10 hover:bg-secondary/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    {seller?.photo ? (
                      <Base64ImageLoader 
                        data={seller.photo} 
                        alt={seller.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-primary text-white text-xl font-bold">
                        {seller?.username.substring(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{seller?.username || 'Vendedor Unisabana'}</h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <span>{seller?.career || 'Estudiante'}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          <span className="font-medium text-foreground">{seller?.reputation || 'N/A'}</span>
                        </div>
                        <span>•</span>
                        <span>({seller?.sales || 0} ventas)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>

            {!isOwner && product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">Cantidad:</span>
                <div className="flex items-center border rounded-lg overflow-hidden bg-white">
                  <button 
                    className="p-2 hover:bg-muted transition-colors border-r disabled:opacity-50"
                    onClick={decrementQty}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button 
                    className="p-2 hover:bg-muted transition-colors border-l disabled:opacity-50"
                    onClick={incrementQty}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">
                  ({product.stock} disponibles)
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {isOwner ? (
                <Button 
                  size="lg" 
                  className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  onClick={() => navigate(`/seller/products/edit/${productID}`)}
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Editar Producto
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    disabled={product.stock <= 0}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Agregar al Carrito
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 border-primary/20 hover:bg-primary/5">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Contactar
                  </Button>
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Descripción
              </h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                {product.description}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Estado</div>
                    <div className="text-sm text-muted-foreground">{product.condition}</div>
                  </div>
                </div>
              </div>
            </div>

            {!isOwner && (
              <div className="flex justify-center pt-8">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => navigate(`/report/${productID}`)}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Reportar publicación
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 sm:mt-24 max-w-2xl border-t pt-12">
          <h2 className="text-xl font-bold text-primary mb-8 px-1">Reseñas ({reviewCount})</h2>
          
          {reviews.length > 0 ? (
            <div className="space-y-8">
              <div className="flex items-center gap-4 sm:gap-6 px-1">
                <span className="text-4xl font-bold text-primary">
                  {product.rating ? Number(product.rating.toFixed(1)) : '0.0'}/5
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-8 h-8 ${star <= Math.round(product.rating || 0) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-8 pt-8 mt-8 border-t border-border/50">
                {reviews.map((review, index) => {
                  const buyer = buyerProfiles[review.buyerID];
                  const buyerInitials = buyer?.username?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

                  return (
                    <div key={`${review.buyerID}-${index}`} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          {buyer?.photo ? (
                            <Base64ImageLoader data={buyer.photo} alt={buyer.username} className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {buyerInitials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="flex gap-0.5 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
                              />
                            ))}
                          </div>
                          <h4 className="font-bold text-sm text-primary">{review.reviewTitle}</h4>
                          <p className="text-xs text-muted-foreground">
                            {buyer?.username || `Usuario #${review.buyerID.substring(0, 5)}`} • {new Date(review.reviewDate).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-prose break-words">
                        {review.reviewBody}
                      </p>
                    </div>
                  );
                })}

                {hasMoreReviews && (
                  <div className="flex justify-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMore}
                      disabled={loadingReviews}
                      className="gap-2"
                    >
                      {loadingReviews && <Loader2 className="w-4 h-4 animate-spin" />}
                      Cargar más reseñas
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 px-1">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-10 h-10 text-muted-foreground border-border" />
                ))}
              </div>
              <p className="text-muted-foreground italic text-sm">Este producto no tiene reseñas aún.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
