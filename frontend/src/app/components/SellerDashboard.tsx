import React from "react";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useNavigate, Link } from "react-router";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { productService, SearchResultItem, Product, ShippingResponseItem } from "../services/productService";
import { userService, UserProfileResponse } from "../services/userService";
import { ShoppingCart, Package, MessageSquare, Star, Loader2, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import Base64ImageLoader from "./Base64ImageLoader";

interface SaleWithProduct extends ShippingResponseItem {
  productDetails?: Product;
}

export function SellerDashboard() {
  const { uid } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [products, setProducts] = useState<SearchResultItem[]>([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sales state
  const [sales, setSales] = useState<SaleWithProduct[]>([]);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingMoreSales, setLoadingMoreSales] = useState(false);
  const [activeOrders, setActiveOrders] = useState(0)

  const fetchSales = async (pageNum: number, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) setLoadingMoreSales(true);
      else setLoadingSales(true);

      const response = await productService.getSellerShippingStatus(pageNum);
      const resultsArray = Object.values(response.results);
      
      const salesWithDetails = await Promise.all(
        resultsArray.map(async (item) => {
          try {
            const productDetails = await productService.getProduct(item.productID);
            return { ...item, productDetails };
          } catch (err) {
            console.error(`Error fetching details for product ${item.productID}:`, err);
            return item;
          }
        })
      );

      if (isLoadMore) {
        setSales(prev => [...prev, ...salesWithDetails]);
      } else {
        setSales(salesWithDetails);
      }
      
      setSalesTotalPages(response.pages);
      setSalesPage(response.page);
      setActiveOrders(response.active || 0)
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('No sales found')) {
        setSales([]);
      } else {
        console.error('Error fetching sales:', err);
      }
    } finally {
      setLoadingSales(false);
      setLoadingMoreSales(false);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!uid) return;
    
    setLoading(true);
    try {
      const data = await userService.getProfile();
      setUser(data);
      
      setLoadingProducts(true);
      const productResp = await productService.searchProducts({ 
        sellerID: uid,
        includeOutOfStock: true,
        page: 1 
      });
      setProducts(Object.values(productResp.results));
      setCount(productResp.count);
      setTotalPages(productResp.pages);
      setCurrentPage(1);

      // Fetch initial sales
      await fetchSales(1);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
      setLoadingProducts(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const loadMoreProducts = async () => {
    if (loadingMore || currentPage >= totalPages || !uid) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const productResp = await productService.searchProducts({ 
        sellerID: uid,
        includeOutOfStock: true,
        page: nextPage 
      });
      setProducts(prev => [...prev, ...Object.values(productResp.results)]);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Error loading more products:", err);
      toast.error("Error al cargar más productos");
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreSales = () => {
    if (salesPage < salesTotalPages) {
      fetchSales(salesPage + 1, true);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setDeletingId(id);
    try {
      await productService.deleteProduct(id);
      toast.success("Producto eliminado exitosamente");
      fetchDashboardData();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Error al eliminar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  function getStatusBadge(status: string) {
    const s = status.toLowerCase();
    if (s.includes('delivered') || s.includes('entregado')) 
      return <Badge variant="default" className="bg-green-600 gap-1.5 py-1 px-3">Entregado</Badge>;
    if (s.includes('in transit') || s.includes('tránsito') || s.includes('enviado')) 
      return <Badge variant="default" className="gap-1.5 py-1 px-3">En tránsito</Badge>;
    if (s.includes('confirmed') || s.includes('confirmado')) 
      return <Badge variant="secondary" className="gap-1.5 py-1 px-3">Confirmado</Badge>;
    if (s.includes('pending') || s.includes('pendiente')) 
      return <Badge variant="outline" className="gap-1.5 py-1 px-3">Pendiente</Badge>;
    if (s.includes('cancelled') || s.includes('cancelado') || s.includes('rechazado')) 
      return <Badge variant="destructive" className="gap-1.5 py-1 px-3">Cancelado</Badge>;
    return <Badge variant="outline" className="gap-1.5 py-1 px-3">{status}</Badge>;
  }

  //TODO: activeOrders set locally can become inconsistent with db
  //const activeOrders = sales.filter((s) => !s.status.toLowerCase().includes("delivered") && !s.status.toLowerCase().includes("entregado") && !s.status.toLowerCase().includes("cancelled") && !s.status.toLowerCase().includes("cancelado")).length;
  const unreadMessages = 0; // placeholder
  const rating = user?.reputation ? parseFloat(user.reputation) : 0;

  if (loading && !products.length && !sales.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">Panel de Vendedor</h2>
          <p className="text-muted-foreground">Resumen de actividad y gestión de tus publicaciones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-3xl font-bold mb-1">{loadingProducts ? "..." : count}</p>
                <p className="text-sm text-muted-foreground">Productos</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-3xl font-bold mb-1">{loadingSales ? "..." : activeOrders}</p>
                <p className="text-sm text-muted-foreground">Órdenes activas</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-3xl font-bold mb-1">{unreadMessages}</p>
                <p className="text-sm text-muted-foreground">Mensajes sin leer</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-3xl font-bold mb-1">{rating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Calificación</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6 border-b">
                <h3 className="font-semibold text-lg">Inventario</h3>
              </div>
              <div className="divide-y">
                <div className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingProducts && products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : products.length > 0 ? (
                        products.map((p) => (
                          <TableRow key={p.productID} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                                  {p.image ? (
                                    <Base64ImageLoader
                                      data={p.image}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-6 h-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium mb-1 truncate max-w-[200px]">{p.name}</h4>
                                  <p className="text-xs text-muted-foreground font-mono">{p.productID}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>${p.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className="text-sm font-medium text-center block w-full">
                                {p.stock}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={p.stock > 0 ? "default" : "secondary"}>
                                {p.stock > 0 ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => navigate(`/seller/products/edit/${p.productID}`)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-destructive hover:bg-destructive/10"
                                      disabled={deletingId === p.productID}
                                    >
                                      {deletingId === p.productID ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el
                                        producto &quot;{p.name}&quot; del catálogo institucional.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteProduct(p.productID)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No tienes productos publicados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {currentPage < totalPages && (
                    <div className="flex justify-center mt-6">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={loadMoreProducts}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cargando...
                          </>
                        ) : (
                          'Cargar más productos'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="mt-6">
              <div className="p-6 border-b">
                <h3 className="font-semibold text-lg">Ventas recientes</h3>
              </div>
              <div className="divide-y">
                {loadingSales && sales.length === 0 ? (
                  <div className="p-6 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Cargando ventas...</p>
                  </div>
                ) : sales.length > 0 ? (
                  sales.map((s) => (
                    <div key={s.saleID} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                          {s.productDetails?.images?.[0] ? (
                            <Base64ImageLoader 
                              data={s.productDetails.images[0]}
                              alt={s.productDetails.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">{s.productDetails?.name || "Cargando..."}</h4>
                          <p className="text-sm text-muted-foreground">ID Venta: {s.saleID}</p>
                          <p className="text-xs text-muted-foreground mt-1">Dirección: {s.shippingAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-between md:justify-end">
                        <div className="text-right">
                          <p className="text-sm font-medium">${((s.productDetails?.price || 0) * s.amount).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{s.amount} unidad(es)</p>
                        </div>
                        {getStatusBadge(s.status)}
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white"
                          onClick={() => navigate(`/seller/orders/${s.saleID}/update`)}
                        >
                          Actualizar envío
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    No tienes ventas registradas.
                  </div>
                )}

                {salesPage < salesTotalPages && (
                  <div className="p-6 flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={loadMoreSales}
                      disabled={loadingMoreSales}
                    >
                      {loadingMoreSales ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {loadingMoreSales ? 'Cargando...' : 'Ver más ventas'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Rendimiento</h3>
              <p className="text-sm text-muted-foreground mb-4">Ventas mensuales (ejemplo)</p>
              <div className="h-40 flex items-center justify-center border rounded-lg bg-muted/20">
                <svg className="w-full h-full p-4" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    points="0,30 25,18 50,24 75,12 100,8"
                  />
                </svg>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Accesos rápidos</h3>
              <div className="grid gap-2">
                <Link to="/seller/products/create">
                  <Button variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90 text-white text-sm">
                    Publicar nuevo producto
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="w-full">Ver mensajes ({unreadMessages})</Button>
                <Button variant="ghost" size="sm" className="w-full">Ajustes de envío</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

