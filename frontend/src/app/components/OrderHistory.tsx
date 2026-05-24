import React, { useEffect, useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Loader2, Package, ShoppingBag } from 'lucide-react'
import { productService, Product } from '../services/productService'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router'
import Base64ImageLoader from './Base64ImageLoader'

interface OrderItem {
    saleID: string;
    productID: string;
    sellerID: string;
    shippingAddress: string;
    amount: number;
    status: string;
    productDetails?: Product;
}

export function OrderHistory() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = async (pageNum: number, isLoadMore: boolean = false) => {
        try {
            if (isLoadMore) setLoadingMore(true);
            else setLoading(true);

            const response = await productService.getShippingStatus(pageNum);
            const resultsArray = Object.values(response.results);

            // Fetch product details for each order item
            const ordersWithDetails = await Promise.all(
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
                setOrders(prev => [...prev, ...ordersWithDetails]);
            } else {
                setOrders(ordersWithDetails);
            }

            setTotalPages(response.pages);
            setPage(response.page);
        } catch (err) {
            const error = err as Error;
            if (error.message && error.message.includes('No purchases found')) {
                setOrders([]);
            } else {
                console.error('Error fetching orders:', error);
                toast.error('Error al cargar el historial de pedidos');
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchOrders(1);
    }, []);

    const handleLoadMore = () => {
        if (page < totalPages) {
            fetchOrders(page + 1, true);
        }
    };

    function getStatusInfo(status: string) {
        if (status.includes('Delivered')) return { label: 'Entregado', variant: 'default' as const, className: 'bg-green-600' };
        if (status.includes('In transit')) return { label: 'En tránsito', variant: 'default' as const  };
        if (status.includes('Confirmed')) return { label: 'Confirmado', variant: 'secondary' as const};
        if (status.includes('Pending')) return { label: 'Pendiente', variant: 'outline' as const};
        if (status.includes('Cancelled')) return { label: 'Cancelado', variant: 'destructive' as const};
        return { label: status, variant: 'outline' as const, className: '' };
    }

    if (loading && page === 1) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Cargando tus pedidos...</p>
            </div>
        );
    }

    return (
        <div className="bg-muted/30 py-12 min-h-[70vh]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-primary mb-2 font-display">Historial de pedidos</h1>
                    <p className="text-muted-foreground">Consulta el estado de tus compras y coordina la entrega</p>
                </header>

                {orders.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No tienes pedidos aún</h3>
                        <p className="text-muted-foreground mb-8">Cuando realices una compra, aparecerá aquí para que puedas seguir su estado.</p>
                        <Button onClick={() => navigate('/search')}>
                            Explorar productos
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="grid gap-6">
                            {orders.map((order) => {
                                const statusInfo = getStatusInfo(order.status);
                                return (
                                    <Card key={order.saleID} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* Product Image */}
                                                <div className="w-24 h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden border">
                                                    {order.productDetails?.images?.[0] ? (
                                                        <Base64ImageLoader
                                                            data={order.productDetails.images[0]}
                                                            alt={order.productDetails.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <Package className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Order info */}
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                PEDIDO #{order.saleID.toUpperCase()}
                                                            </p>
                                                            <h3 className="font-semibold text-lg mb-1 line-clamp-2 cursor-pointer hover:text-primary transition-colors">
                                                                {order.productDetails?.name || 'Cargando producto...'}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                Cantidad: <span className="font-medium text-foreground">{order.amount}</span>
                                                            </p>
                                                        </div>
                                                        <Badge variant={statusInfo.variant} className={`${statusInfo.className} gap-1.5 py-1 px-3`}>
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                                        <div>
                                                            <p className="text-sm mb-1 font-semibold">Dirección de Entrega:</p>
                                                            <p className="text-sm text-muted-foreground mb-2" title={order.shippingAddress}>{order.shippingAddress}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 sm:justify-end">
                                                            <Button asChild size="sm" variant="outline">
                                                                <Link to={`/orders/${order.saleID}/status`}>Ver pedido</Link>
                                                            </Button>
                                                            <Button asChild size="sm">
                                                                <Link to={`/chat?user=${order.sellerID}`}>Contacto</Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        {page < totalPages && (
                            <div className="flex justify-center pt-8">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="min-w-[200px]"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Cargando más...
                                        </>
                                    ) : (
                                        'Cargar más pedidos'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
