import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Star } from 'lucide-react';
import { Link } from 'react-router';
import Base64ImageLoader from './Base64ImageLoader';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  condition?: string;
  category?: string;
  seller?: string;
  rating: number;
}

export function ProductCard({
  id,
  title,
  price,
  image,
  condition,
  category,
  seller,
  rating,
}: ProductCardProps) {
  return (
    <Link to={`/product/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
        <div className="relative h-48 bg-muted overflow-hidden">
          {image ? (
            <Base64ImageLoader
              data={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
          {condition && (
            <Badge className="absolute top-3 right-3 bg-white text-primary border-0">
              {condition}
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="flex-1">
            {category && (
              <Badge variant="secondary" className="text-xs mb-2">
                {category}
              </Badge>
            )}
            <h3 className="font-semibold line-clamp-2 min-h-[3rem]">{title}</h3>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${price.toLocaleString('es-CO')}
            </span>
            <span className="text-sm text-muted-foreground">COP</span>
          </div>

          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {seller ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {seller[0]}
                    </div>
                    <span className="text-muted-foreground truncate max-w-[100px]">{seller}</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Vendedor verificado</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="font-medium">{rating ? rating.toFixed(1) : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
