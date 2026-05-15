import { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { Button } from './ui/button';
import { Grid3x3, List, Loader2, PackageX } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Link } from 'react-router';
import { productService, SearchResultItem } from '../services/productService';

export function ProductsGrid() {
  const [products, setProducts] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        // Categories to recommend: Libros, Tecnología, Papelería, Accesorios
        // Min rating: 4
        const response = await productService.searchProducts({
          categories: 'Libros,Tecnología,Papelería,Accesorios',
          minRating: 4,
          page: 1,
        });
        
        // Convert the results object to an array
        const resultItems = Object.values(response.results);
        setProducts(resultItems);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-primary mb-2 font-display">
            Productos Recomendados
          </h2>
          <p className="text-muted-foreground">
            Sugerencias basadas en tus intereses y calidad de los vendedores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Tabs defaultValue="grid" className="hidden sm:block">
            <TabsList>
              <TabsTrigger value="grid">
                <Grid3x3 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando recomendaciones...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.productID} 
              id={product.productID}
              title={product.name}
              price={product.price}
              image={product.image}
              rating={product.rating}
              // These fields aren't in SearchResultItem directly, but ProductCard might expect them
              // We'll pass what we have and maybe adjust ProductCard if needed
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <PackageX className="w-12 h-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No encontramos recomendaciones en este momento.</p>
        </div>
      )}

      <div className="flex justify-center mt-12">
        <Link to="/search">
          <Button variant="outline" size="lg">
            Ver todos los productos
          </Button>
        </Link>
      </div>
    </div>
  );
}
