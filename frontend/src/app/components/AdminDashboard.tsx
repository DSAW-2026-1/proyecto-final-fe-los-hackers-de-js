import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Users,
  Package,
  TrendingUp,
  CheckCircle,
  Loader2,
  Flag,
  Box,
  Search,
  Trash2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminService, AdminDashboardStats, AdminReport, AdminProduct, AdminUser } from '../services/adminService';
import { userService } from '../services/userService';
import { productService } from '../services/productService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import Base64ImageLoader from './Base64ImageLoader';
import { Avatar, AvatarFallback } from './ui/avatar';

function ReportItemRow({ report }: { report: AdminReport }) {
  const navigate = useNavigate();
  const [reportedName, setReportedName] = useState<string | null>(null);
  const [reportedSubtext, setReportedSubtext] = useState<string | null>(null);
  const [reportedImage, setReportedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        if (report.type === 'productReport') {
          const product = await productService.getProduct(report.reportedID);
          setName(product.name);
          setSubtext(`${product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`);
          if (product.images && product.images[0]) {
            setImage(product.images[0]);
          }
        } else {
          const user = await userService.getProfileByUid(report.reportedID);
          setName(user.username);
          setSubtext(user.career || 'Estudiante');
          setImage(user.photo);
        }
      } catch (error) {
        console.error('Error fetching reported item:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [report.reportedID, report.type]);

  // Temporary helper to update local state without changing logic
  const setName = (val: string) => setReportedName(val);
  const setSubtext = (val: string) => setReportedSubtext(val);
  const setImage = (val: string | null) => setReportedImage(val);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors animate-pulse">
        <div className="flex items-center gap-6 flex-1">
          <div className="w-16 h-16 bg-muted rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
        <div className="w-32 h-10 bg-muted rounded" />
      </div>
    );
  }

  const initials = reportedName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';

  return (
    <div key={report.reportID} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-6 flex-1 text-left">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {report.type === 'productReport' ? (
              <div className="w-16 h-16 rounded bg-stone-100 border flex items-center justify-center overflow-hidden shadow-sm">
                {reportedImage ? (
                  <Base64ImageLoader data={reportedImage} alt={reportedName || ''} className="w-full h-full object-cover" />
                ) : (
                  <Box className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
            ) : (
              <Avatar className="w-16 h-16 border shadow-sm">
                {reportedImage ? (
                  <Base64ImageLoader data={reportedImage} alt={reportedName || ''} className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="text-[10px] py-0 h-5">
                {report.type === 'productReport' ? 'Producto' : 'Usuario'}
              </Badge>
              <Badge variant="destructive" className="text-[10px] py-0 h-5">Prioridad Alta</Badge>
            </div>
            <h4 className="font-medium text-lg leading-tight mb-1 truncate text-primary">{report.reportTitle}</h4>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-destructive/80">Reportado:</span>
              <span className="text-muted-foreground truncate max-w-[200px]">{reportedName || 'Desconocido'}</span>
              {reportedSubtext && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-muted-foreground truncate">{reportedSubtext}</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground/50 mt-1">ID: {report.reportID.substring(0, 8)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-6 min-w-fit">
        <div className="h-10 border-l mr-3 opacity-20 hidden md:block" />
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
            onClick={() => navigate(`/admin/reports/${report.reportID}`)}
          >
            <span className="hidden lg:inline">Ver reporte</span>
            <span className="lg:hidden">Ver</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProductItemRow({ product }: { product: AdminProduct }) {
  const navigate = useNavigate();
  
  return (
    <div className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-16 h-16 rounded bg-stone-100 border flex items-center justify-center overflow-hidden shadow-sm">
          {product.image ? (
            <Base64ImageLoader data={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Box className="w-8 h-8 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium mb-1 hover:text-primary cursor-pointer" onClick={() => navigate(`/product/${product.productID}`)}>{product.name}</h4>
          <p className="text-sm text-muted-foreground">
            {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} • Stock: {product.stock}
          </p>
          <p className="text-xs text-muted-foreground/50">ID: {product.productID.substring(0, 8)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          variant={product.deleted ? 'destructive' : 'default'}
          className={!product.deleted ? 'bg-green-600' : ''}
        >
          {product.deleted ? 'Eliminado' : 'Activo'}
        </Badge>
        <div className="flex gap-2">
          {!product.deleted && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:bg-destructive/10"
              onClick={() => navigate(`/admin/delete-product/${product.productID}`)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserItemRow({ user }: { user: AdminUser }) {
  const navigate = useNavigate();
  const initials = user.username.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
      <div className="flex items-center gap-4 flex-1">
        <Avatar className="w-12 h-12 border shadow-sm">
          {user.photo ? (
            <Base64ImageLoader data={user.photo} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <h4 
            className="font-medium mb-1 hover:text-primary cursor-pointer truncate max-w-[200px] md:max-w-md" 
            onClick={() => navigate(`/profile/${user.UID}`)}
          >
            {user.username}
          </h4>
          <p className="text-sm text-muted-foreground truncate max-w-[250px]">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] py-0 h-4">
              {user.isSeller ? 'Vendedor' : 'Comprador'}
            </Badge>
            {user.career && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{user.career}</span>
            )}
            {user.reputation !== null && (
              <span className="text-[10px] text-muted-foreground">★ {user.reputation}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          variant={user.isSuspended ? 'destructive' : 'default'}
          className={!user.isSuspended ? 'bg-green-600' : ''}
        >
          {user.isSuspended ? 'Suspendido' : 'Activo'}
        </Badge>
        <div className="flex gap-2">
          {!user.isSuspended && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/admin/suspend-user/${user.UID}`)}
              className="hidden sm:inline-flex"
            >
              Suspender
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [totalUsersPages, setTotalUsersPages] = useState(0);
  const [usersQuery, setUsersQuery] = useState('');

  // Products state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [totalProductsPages, setTotalProductsPages] = useState(0);
  const [productsQuery, setProductsQuery] = useState('');

  // Reports state
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingMoreReports, setLoadingMoreReports] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [totalReportsPages, setTotalReportsPages] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoadingStats(true);
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        toast.error('No se pudieron cargar las estadísticas del panel');
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
    fetchReports(1, true);
    fetchProducts(1, true, '');
    fetchUsers(1, true, '');
  }, []);

  async function fetchUsers(page: number, initial: boolean = false, query: string = '') {
    try {
      if (initial) setLoadingUsers(true);
      else setLoadingMoreUsers(true);

      const response = await adminService.getUsers(page, query);
      
      if (!response || !response.results) {
        if (initial) setUsers([]);
        setUsersPage(page);
        setTotalUsersPages(0);
        return;
      }

      const usersArray = Object.values(response.results);
      
      if (initial) {
        setUsers(usersArray);
      } else {
        setUsers(prev => [...prev, ...usersArray]);
      }
      
      setUsersPage(response.page);
      setTotalUsersPages(response.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (initial) {
        setUsers([]);
        setTotalUsersPages(0);
      }
    } finally {
      setLoadingUsers(false);
      setLoadingMoreUsers(false);
    }
  }

  const handleSearchUsers = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, true, usersQuery);
  };

  const handleLoadMoreUsers = () => {
    if (usersPage < totalUsersPages) {
      fetchUsers(usersPage + 1, false, usersQuery);
    }
  };

  async function fetchProducts(page: number, initial: boolean = false, query: string = '') {
    try {
      if (initial) setLoadingProducts(true);
      else setLoadingMoreProducts(true);

      const response = await adminService.getProducts(page, query);
      
      // Handle potential 204/404 via apiRequest null return
      if (!response || !response.results) {
        if (initial) setProducts([]);
        setProductsPage(page);
        setTotalProductsPages(0);
        return;
      }

      const productsArray = Object.values(response.results);
      
      if (initial) {
        setProducts(productsArray);
      } else {
        setProducts(prev => [...prev, ...productsArray]);
      }
      
      setProductsPage(response.page);
      setTotalProductsPages(response.pages);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (initial) {
        setProducts([]);
        setTotalProductsPages(0);
      }
    } finally {
      setLoadingProducts(false);
      setLoadingMoreProducts(false);
    }
  }

  const handleSearchProducts = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1, true, productsQuery);
  };

  const handleLoadMoreProducts = () => {
    if (productsPage < totalProductsPages) {
      fetchProducts(productsPage + 1, false, productsQuery);
    }
  };

  async function fetchReports(page: number, initial: boolean = false) {
    try {
      if (initial) setLoadingReports(true);
      else setLoadingMoreReports(true);

      const response = await adminService.getReports(page);
      
      // Handle 204 or empty response
      if (!response || !response.results) {
        if (initial) setReports([]);
        setReportsPage(page);
        setTotalReportsPages(0);
        return;
      }

      const reportsArray = Object.values(response.results);
      
      if (initial) {
        setReports(reportsArray);
      } else {
        setReports(prev => [...prev, ...reportsArray]);
      }
      
      setReportsPage(response.page);
      setTotalReportsPages(response.pages);
    } catch (error) {
      console.error('Error fetching reports:', error);
      if (initial) {
        toast.error('No se pudieron cargar los reportes');
      }
    } finally {
      setLoadingReports(false);
      setLoadingMoreReports(false);
    }
  }

  const handleLoadMoreReports = () => {
    if (reportsPage < totalReportsPages) {
      fetchReports(reportsPage + 1);
    }
  };

  const statCards = stats ? [
    { label: 'Usuarios Totales', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: 'Vendedores Activos', value: stats.activeSellers.toLocaleString(), icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    { label: 'Productos Totales', value: stats.totalProducts.toLocaleString(), icon: Package, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Ventas Totales', value: stats.totalSales.toLocaleString(), icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ] : [];

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2 text-left">Panel de Administración</h2>
          <p className="text-muted-foreground text-left">Gestiona el marketplace y modera contenido</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-left">
          {loadingStats ? (
            [...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-muted mb-4" />
                <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </Card>
            ))
          ) : (
            statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="justify-start">
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Catálogo de Productos</h3>
                  <p className="text-sm text-muted-foreground">Monitorea y gestiona las publicaciones</p>
                </div>
                <form onSubmit={handleSearchProducts} className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar producto por nombre..." 
                    className="pl-9 pr-4"
                    value={productsQuery}
                    onChange={(e) => setProductsQuery(e.target.value)}
                  />
                </form>
              </div>
              <div className="divide-y text-left">
                {loadingProducts ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-muted-foreground">Cargando productos...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-12 text-center">
                    <Box className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                    <p className="text-xl font-bold">No se encontraron productos</p>
                    <p className="text-muted-foreground">
                      {productsQuery ? `No hay resultados para "${productsQuery}"` : 'El catálogo está vacío.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {products.map((product) => (
                      <ProductItemRow 
                        key={product.productID} 
                        product={product} 
                      />
                    ))}
                    
                    {productsPage < totalProductsPages && (
                      <div className="p-6 border-t flex justify-center">
                        <Button 
                          variant="outline" 
                          onClick={handleLoadMoreProducts}
                          disabled={loadingMoreProducts}
                        >
                          {loadingMoreProducts ? (
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
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Directorio de Usuarios</h3>
                  <p className="text-sm text-muted-foreground">Gestiona las cuentas y moderación de accesos</p>
                </div>
                <form onSubmit={handleSearchUsers} className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar usuario por nombre o email..." 
                    className="pl-9 pr-4"
                    value={usersQuery}
                    onChange={(e) => setUsersQuery(e.target.value)}
                  />
                </form>
              </div>
              <div className="divide-y text-left">
                {loadingUsers ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-muted-foreground">Cargando usuarios...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                    <p className="text-xl font-bold">No se encontraron usuarios</p>
                    <p className="text-muted-foreground">
                      {usersQuery ? `No hay resultados para "${usersQuery}"` : 'No hay usuarios registrados.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {users.map((user) => (
                      <UserItemRow 
                        key={user.UID} 
                        user={user} 
                      />
                    ))}
                    
                    {usersPage < totalUsersPages && (
                      <div className="p-6 border-t flex justify-center">
                        <Button 
                          variant="outline" 
                          onClick={handleLoadMoreUsers}
                          disabled={loadingMoreUsers}
                        >
                          {loadingMoreUsers ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            'Cargar más usuarios'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <div className="p-6 border-b text-left">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Flag className="w-5 h-5 text-primary" />
                  Reportes Pendientes
                </h3>
              </div>
              <div className="divide-y text-left">
                {loadingReports ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-muted-foreground">Cargando reportes...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                    <p className="text-xl font-bold">No hay reportes pendientes</p>
                    <p className="text-muted-foreground">¡Buen trabajo! El marketplace está limpio.</p>
                  </div>
                ) : (
                  <>
                    {reports.map((report) => (
                      <ReportItemRow key={report.reportID} report={report} />
                    ))}
                    
                    {reportsPage < totalReportsPages && (
                      <div className="p-6 border-t flex justify-center">
                        <Button 
                          variant="outline" 
                          onClick={handleLoadMoreReports}
                          disabled={loadingMoreReports}
                        >
                          {loadingMoreReports ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            'Cargar más reportes'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
