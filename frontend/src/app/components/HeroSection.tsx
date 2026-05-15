import { Button } from './ui/button';
import { ArrowRight, Package, Users, Shield } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function HeroSection() {
  const { isSeller } = useAuth();

  return (
    <div className="relative bg-gradient-to-br from-primary via-primary to-[#1e4976] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Unisabana<br />
              <span className="text-accent">Marketplace</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Compra y vende de forma segura dentro de la comunidad universitaria de La Sabana
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/search">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                  Explorar Productos
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {isSeller && (
                <Link to="/seller/products/create">
                  <Button size="lg" variant="secondary" className="bg-white/10 border-none text-white hover:bg-white hover:text-primary transition-all shadow-none">
                    Publicar Producto
                  </Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-2xl">500+</div>
                  <div className="text-sm text-white/70">Productos</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-2xl">1.2K</div>
                  <div className="text-sm text-white/70">Usuarios</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-2xl">100%</div>
                  <div className="text-sm text-white/70">Seguro</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-3xl" />
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="h-40 bg-white/20 rounded-lg" />
                  <div className="flex gap-4">
                    <div className="h-24 flex-1 bg-white/20 rounded-lg" />
                    <div className="h-24 flex-1 bg-white/20 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
