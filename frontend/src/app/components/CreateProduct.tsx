import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Upload, X, DollarSign, Package, Image as ImageIcon, Loader2 } from 'lucide-react';
import { productService, CreateProductRequest } from '../services/productService';
import { toast } from 'sonner';
import { CATEGORIES, CONDITIONS } from '../constants';

export function CreateProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('1');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList | File[]) => {
    if (images.length + files.length > 6) {
      toast.error('Máximo 6 imágenes permitidas');
      return;
    }

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} es muy grande (máx 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !category || !condition || !description || !price || !stock || images.length === 0) {
      toast.error('Por favor completa todos los campos obligatorios y sube al menos una imagen');
      return;
    }

    if (description.length < 50) {
      toast.error('La descripción debe tener al menos 50 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      const imageObject: { [key: number]: string } = {};
      images.forEach((img, index) => {
        // Extract base64 content if it has the data:image prefix
        const base64Content = img.includes(',') ? img.split(',')[1] : img;
        imageObject[index] = base64Content;
      });

      const request: CreateProductRequest = {
        name,
        category,
        condition,
        price: parseInt(price),
        description,
        images: imageObject,
        stock: parseInt(stock)
      };

      await productService.createProduct(request);
      toast.success('Producto publicado exitosamente');
      navigate('/seller');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Ocurrió un error al publicar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Publicar Producto</h1>
          <p className="text-muted-foreground">
            Completa la información de tu producto para publicarlo en el marketplace
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Información Básica</h2>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Producto *</Label>
                  <Input
                    id="title"
                    placeholder="Ej: MacBook Air M1 2020 - 256GB"
                    className="text-lg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sé descriptivo y específico (máx. 80 caracteres)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="pl-11">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition">Estado *</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map(cond => (
                          <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe tu producto: características, estado, accesorios incluidos, razón de venta, etc."
                    className="min-h-32 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground flex justify-between">
                    <span>Mínimo 50 caracteres</span>
                    <span>{description.length} caracteres</span>
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (COP) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="0"
                        className="pl-11"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Unidades Disponibles *</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="1"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Imágenes del Producto</h2>

              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                    isDragging 
                      ? "border-primary bg-primary/10 scale-[1.02]" 
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium mb-1">Arrastra tus imágenes aquí</p>
                      <p className="text-sm text-muted-foreground">
                        o haz clic para seleccionar archivos
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG hasta 5MB (máx. {6 - images.length} más)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg border-2 border-border bg-muted overflow-hidden group">
                      <img 
                        src={img} 
                        alt={`Preview ${index}`} 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 bg-primary text-[10px] h-4 px-1">
                          Principal
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Vista Previa</h3>

              <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {images.length > 0 ? (
                    <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>

                <div>
                  <Badge variant="secondary" className="mb-2">{category || 'Categoría'}</Badge>
                  <h3 className="font-semibold text-lg mb-2 truncate">{name || 'Título del producto'}</h3>
                  <p className="text-2xl font-bold text-primary mb-2">
                    {price ? `$${parseInt(price).toLocaleString('es-CO')}` : '$0'}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem]">
                    {description || 'Descripción del producto...'}
                  </p>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-semibold text-sm">Consejos:</h4>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li>✓ Usa fotos claras y bien iluminadas</li>
                    <li>✓ Incluye todos los detalles importantes</li>
                    <li>✓ Sé honesto sobre el estado del producto</li>
                    <li>✓ Responde rápido a los mensajes</li>
                  </ul>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90" 
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publicando...</>
                    ) : (
                      'Publicar Producto'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate('/seller')}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
