import { useState, useEffect, useCallback } from 'react';
import { ProductCard } from './ProductCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { 
  SlidersHorizontal, 
  Grid3x3, 
  List, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
  SearchX
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from './ui/sheet';
import { CATEGORIES, CONDITIONS } from '../constants';
import { useSearchParams } from 'react-router';
import { productService, SearchResultItem } from '../services/productService';
import { ApiError } from '../services/api';

export function ProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [count, setCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get('fromPrice')) || 0,
    Number(searchParams.get('toPrice')) || 5000000
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('categories')?.split(',').filter(Boolean) || []
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    searchParams.get('conditions')?.split(',').filter(Boolean) || []
  );
  const [minRating, setMinRating] = useState<number | null>(
    searchParams.get('minRating') ? Number(searchParams.get('minRating')) : null
  );
  const [searchDescription, setSearchDescription] = useState(
    searchParams.get('searchDescription') === 'true'
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        query: searchParams.get('query') || undefined,
        page: Number(searchParams.get('page')) || 1,
        categories: searchParams.get('categories') || undefined,
        conditions: searchParams.get('conditions') || undefined,
        fromPrice: Number(searchParams.get('fromPrice')) || undefined,
        toPrice: Number(searchParams.get('toPrice')) || undefined,
        minRating: Number(searchParams.get('minRating')) || undefined,
        searchDescription: searchParams.get('searchDescription') === 'true' || undefined,
      };

      const resp = await productService.searchProducts(params);
      setResults(Object.values(resp.results));
      setCount(resp.count);
      setPages(resp.pages);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      if (apiError.status === 404) {
        setResults([]);
        setCount(0);
        setPages(0);
      } else {
        // Handle network errors or generic errors more gracefully
        let message = 'Error al buscar productos. Intenta de nuevo más tarde.';
        
        const isNetworkError = 
          !apiError.status || 
          apiError.message?.toLowerCase().includes('networkerror') || 
          apiError.message?.toLowerCase().includes('failed to fetch');

        if (isNetworkError) {
          message = 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
        } else if (apiError.data && typeof apiError.data === 'string') {
          message = apiError.data;
        } else if (apiError.message) {
          message = apiError.message;
        }

        setError(message);
        console.error('Search error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [fetchProducts]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    // Reset page on filter change
    if (newParams.page === undefined) {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchParams({ query: searchParams.get('query') || '' });
    setPriceRange([0, 5000000]);
    setSelectedCategories([]);
    setSelectedConditions([]);
    setMinRating(null);
    setSearchDescription(false);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedCategories, category]
      : selectedCategories.filter(c => c !== category);
    setSelectedCategories(updated);
    updateFilters({ categories: updated.length > 0 ? updated.join(',') : null });
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedConditions, condition]
      : selectedConditions.filter(c => c !== condition);
    setSelectedConditions(updated);
    updateFilters({ conditions: updated.length > 0 ? updated.join(',') : null });
  };

  const handleRatingChange = (rating: number, checked: boolean) => {
    const newVal = checked ? rating : null;
    setMinRating(newVal);
    updateFilters({ minRating: newVal ? newVal.toString() : null });
  };

  const handleSearchDescriptionChange = (checked: boolean) => {
    setSearchDescription(checked);
    updateFilters({ searchDescription: checked ? 'true' : null });
  };

  const handlePriceChange = (val: number[]) => {
    setPriceRange(val);
    // Debounce this in a real app, but for now we'll update on release or similar
  };

  const applyPriceFilter = () => {
    updateFilters({ 
      fromPrice: priceRange[0] > 0 ? priceRange[0].toString() : null,
      toPrice: priceRange[1] < 5000000 ? priceRange[1].toString() : null
    });
  };

  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = 12;
  const startItem = count > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = (currentPage - 1) * itemsPerPage + results.length;

  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Category */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center justify-between cursor-pointer group">
            Categorías
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </h4>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-3">
                <Checkbox 
                  id={`cat-${cat}`} 
                  checked={selectedCategories.includes(cat)}
                  onCheckedChange={(checked) => handleCategoryChange(cat, !!checked)}
                />
                <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer hover:text-primary transition-colors">
                  {cat}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <h4 className="font-semibold mb-6">Rango de Precio (COP)</h4>
          <Slider 
            value={priceRange} 
            max={5000000} 
            step={50000} 
            className="mb-4"
            onValueChange={handlePriceChange}
            onValueCommit={applyPriceFilter}
          />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Mínimo</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input value={priceRange[0].toLocaleString()} readOnly className="h-8 pl-5 text-xs font-mono bg-muted/30" />
              </div>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Máximo</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input value={priceRange[1].toLocaleString()} readOnly className="h-8 pl-5 text-xs font-mono bg-muted/30" />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Condition */}
        <div>
          <h4 className="font-semibold mb-4">Estado</h4>
          <div className="space-y-3">
            {CONDITIONS.map((cond) => (
              <div key={cond} className="flex items-center gap-3">
                <Checkbox 
                  id={`cond-${cond}`} 
                  checked={selectedConditions.includes(cond)}
                  onCheckedChange={(checked) => handleConditionChange(cond, !!checked)}
                />
                <Label htmlFor={`cond-${cond}`} className="text-sm cursor-pointer hover:text-primary transition-colors">
                  {cond}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <h4 className="font-semibold mb-4">Reputación Mínima</h4>
          <div className="space-y-3">
            {[4, 3, 2].map((stars) => (
              <div key={stars} className="flex items-center gap-3">
                <Checkbox 
                  id={`rating-${stars}`} 
                  checked={minRating === stars}
                  onCheckedChange={(checked) => handleRatingChange(stars, !!checked)}
                />
                <Label htmlFor={`rating-${stars}`} className="flex items-center gap-1 cursor-pointer group">
                  <span className="text-sm group-hover:text-primary transition-colors">{stars}+</span>
                  <Star className="w-3 h-3 fill-accent text-accent" />
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Advanced */}
        <div>
          <h4 className="font-semibold mb-4">Avanzado</h4>
          <div className="flex items-center gap-3">
            <Checkbox 
              id="searchDescription" 
              checked={searchDescription}
              onCheckedChange={(checked) => handleSearchDescriptionChange(!!checked)}
            />
            <Label htmlFor="searchDescription" className="text-sm cursor-pointer hover:text-primary transition-colors">
              Incluir descripción en búsqueda
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background py-12 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-primary mb-2">
            {searchParams.get('query') ? `Resultados para "${searchParams.get('query')}"` : 'Explorar Marketplace'}
          </h2>
          <p className="text-muted-foreground">Busca entre cientos de artículos de otros estudiantes</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-8">
            <div className="hidden lg:block p-6 rounded-xl border bg-muted/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Filtros</h3>
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2 hover:text-primary" onClick={clearFilters}>
                  Limpiar todo
                </Button>
              </div>
              <FiltersContent />
            </div>

            {/* Mobile Filter Trigger */}
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full lg:hidden flex items-center justify-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Ver Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col">
                <SheetHeader className="p-6 pb-4 border-b bg-muted/10">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl font-bold">Filtros</SheetTitle>
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={clearFilters}>
                      Limpiar
                    </Button>
                  </div>
                  <SheetDescription className="text-xs">
                    Ajusta los filtros para encontrar lo que buscas.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          </aside>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Buscando...' : (
                  <>Mostrando <span className="font-bold text-foreground">{startItem}-{endItem}</span> de <span className="font-bold text-foreground">{count}</span> resultados</>
                )}
              </p>

              <div className="flex items-center gap-3">
                <Tabs defaultValue="grid">
                  <TabsList className="h-8">
                    <TabsTrigger value="grid" className="h-7 w-7 p-0">
                      <Grid3x3 className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list" className="h-7 w-7 p-0">
                      <List className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {loading ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Buscando los mejores productos...</p>
              </div>
            ) : error ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border rounded-2xl bg-destructive/5">
                <p className="text-destructive font-semibold mb-2">{error}</p>
                <Button variant="outline" onClick={() => fetchProducts()}>Reintentar</Button>
              </div>
            ) : results.length === 0 ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-2xl bg-muted/10">
                <SearchX className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-primary mb-2">No encontramos resultados</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Intenta con términos de búsqueda más generales o ajusta tus filtros.
                </p>
                <Button onClick={clearFilters}>Limpiar Filtros</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {results.map((p) => (
                    <ProductCard 
                      key={p.productID} 
                      id={p.productID}
                      title={p.name}
                      price={p.price}
                      rating={p.rating}
                      image={p.image}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-center pt-8">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 gap-1 px-3"
                        disabled={currentPage <= 1}
                        onClick={() => updateFilters({ page: (currentPage - 1).toString() })}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Anterior</span>
                      </Button>
                      
                      {(() => {
                        const pageNumbers = [];
                        const range = 2; // Two pages on each side
                        
                        // Always include page 1
                        pageNumbers.push(1);
                        
                        if (currentPage > range + 2) {
                          pageNumbers.push(null); // Ellipsis
                        }
                        
                        const start = Math.max(2, currentPage - range);
                        const end = Math.min(pages - 1, currentPage + range);
                        
                        for (let i = start; i <= end; i++) {
                          pageNumbers.push(i);
                        }
                        
                        if (currentPage < pages - range - 1) {
                          pageNumbers.push(null); // Ellipsis
                        }
                        
                        // Always include last page
                        if (pages > 1) {
                          pageNumbers.push(pages);
                        }
                        
                        return pageNumbers.map((pageNum, idx) => {
                          if (pageNum === null) {
                            return <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>;
                          }
                          return (
                            <Button 
                              key={pageNum} 
                              variant={pageNum === currentPage ? 'default' : 'outline'} 
                              size="sm"
                              className="w-10 h-10 p-0"
                              onClick={() => updateFilters({ page: pageNum.toString() })}
                            >
                              {pageNum}
                            </Button>
                          );
                        });
                      })()}

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 gap-1 px-3"
                        disabled={currentPage >= pages}
                        onClick={() => updateFilters({ page: (currentPage + 1).toString() })}
                      >
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
