import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Lock, 
  Bell, 
  ShieldCheck, 
  ArrowLeft,
  Save,
  Building,
  GraduationCap,
  Loader2,
  Store
} from 'lucide-react';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { userService, UserProfileResponse, UpdateProfileRequest } from '../services/userService';
import { ConnectionError } from './ConnectionError';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { FACULTIES } from '../constants';
import Base64ImageLoader from './Base64ImageLoader';

export function EditProfile() {
  const navigate = useNavigate();
  const { setUserInfo, login } = useAuth();
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [initialIsSeller, setInitialIsSeller] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setUser(data);
        setUsername(data.username);
        setPhotoPreview(data.photo ? `data:image/jpeg;base64,${data.photo}` : null);
        setIsSeller(data.isSeller);
        setInitialIsSeller(data.isSeller);
        
        // Find faculty based on career
        if (data.career) {
          const faculty = FACULTIES.find(f => 
            f.programs.some(p => p.toLowerCase() === data.career?.toLowerCase())
          );
          if (faculty) {
            setSelectedFaculty(faculty.id);
            setSelectedProgram(data.career);
          } else {
            setSelectedFaculty("");
            setSelectedProgram(data.career);
          }
        }
      } catch (error) {
        console.error('Error fetching profile for edit:', error);
        toast.error('Error al cargar la información del perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, []);

  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value);
    setSelectedProgram("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen es muy grande. Máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        const cleanBase64 = base64String.split(',')[1];
        setPhotoBase64(cleanBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (!currentPassword || !newPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      await userService.changePassword(currentPassword, newPassword);
      toast.success('Contraseña cambiada correctamente');
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error('Error changing password:', error);
      const apiError = error as ApiError;
      
      if (apiError.status === 401) {
        toast.error('La contraseña actual es incorrecta');
      } else if (apiError.status === 400) {
        toast.error('Datos inválidos. Verifica que la contraseña nueva cumpla los requisitos');
      } else if (apiError.status === 404) {
        toast.error('Usuario no encontrado');
      } else {
        toast.error('Ocurrió un error al cambiar la contraseña');
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
      toast.error('El nombre de usuario debe ser alfanumérico');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: UpdateProfileRequest = {};
      
      if (username !== user.username) {
        updateData.username = username;
      }
      
      const currentProgram = selectedProgram || "";
      if (currentProgram !== (user.career || "")) {
        updateData.career = currentProgram;
      }
      
      if (photoBase64) {
        updateData.photo = photoBase64;
      }

      let newToken = null;
      if (!initialIsSeller && isSeller) {
        try {
          const response = await userService.registerAsSeller();
          newToken = response.token;
        } catch (sellerError) {
          console.error('Error registering as seller:', sellerError);
          toast.error('No se pudo activar la cuenta de vendedor');
          setIsSaving(false);
          return;
        }
      }

      if (Object.keys(updateData).length === 0 && !newToken) {
        toast.info('No hay cambios para guardar');
        setIsSaving(false);
        return;
      }

      if (Object.keys(updateData).length > 0) {
        await userService.updateProfile(updateData);
      }
      
      if (newToken) {
        login(newToken);
      }
      
      if (updateData.username) {
        setUserInfo({ username: updateData.username, email: user.email });
      }

      toast.success('Perfil actualizado correctamente');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      const apiError = error as ApiError;
      
      if (apiError.status === 409) {
        toast.error('El nombre de usuario ya está en uso');
      } else if (apiError.status === 400) {
        toast.error('Error en la solicitud. Verifica los datos.');
      } else {
        toast.error('Ocurrió un error al guardar los cambios');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  const userInitial = user.username.charAt(0).toUpperCase();

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="pl-0 text-muted-foreground hover:text-primary"
              onClick={() => navigate('/profile')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Ver Mi Perfil
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">Configuración de Cuenta</h1>
          <p className="text-muted-foreground">Administra tu información personal y preferencias de seguridad</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="space-y-1">
              <Button variant="secondary" className="w-full justify-start font-semibold">
                <User className="w-4 h-4 mr-3" />
                Información Pública
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                <Lock className="w-4 h-4 mr-3" />
                Seguridad
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                <Bell className="w-4 h-4 mr-3" />
                Notificaciones
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                <ShieldCheck className="w-4 h-4 mr-3" />
                Privacidad
              </Button>
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-6">
            <Card className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-1 ring-border">
                    {photoPreview ? (
                      <Base64ImageLoader 
                        data={photoPreview} 
                        alt={user.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-transform active:scale-95">
                    <Camera className="w-4 h-4" />
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-1">Tu Foto de Perfil</h2>
                    <p className="text-sm text-muted-foreground">Esta foto será visible para compradores y vendedores en el campus.</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Button 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Actualizar Foto
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Información del Estudiante
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input 
                    id="username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tu nombre de usuario"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="faculty">Facultad</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Select value={selectedFaculty} onValueChange={handleFacultyChange}>
                      <SelectTrigger className="pl-11">
                        <SelectValue placeholder="Selecciona tu facultad" />
                      </SelectTrigger>
                      <SelectContent>
                        {FACULTIES.map(faculty => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program">Programa Académico</Label>
                   <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Select 
                      value={selectedProgram} 
                      onValueChange={setSelectedProgram}
                      disabled={!selectedFaculty}
                    >
                      <SelectTrigger className="pl-11">
                        <SelectValue placeholder={selectedFaculty ? "Selecciona tu programa" : "Primero elige una facultad"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFaculty && FACULTIES.find(f => f.id === selectedFaculty)?.programs.map(program => (
                          <SelectItem key={program} value={program}>
                            {program}
                          </SelectItem>
                        ))}
                        {selectedProgram && (!selectedFaculty || !FACULTIES.find(f => f.id === selectedFaculty)?.programs.includes(selectedProgram)) && (
                          <SelectItem value={selectedProgram}>{selectedProgram}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Contacto y Ubicación
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="email" defaultValue={user.email} disabled className="pl-11 bg-muted/50" />
                  </div>
                  <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Email Verificado ✓</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-8 scroll-mt-24" id="security-section">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Cambiar Contraseña
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                  <Input 
                    id="confirmNewPassword" 
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handlePasswordChange}>Cambiar Contraseña</Button>
              </div>
            </Card>

            <Card className="p-8 scroll-mt-24" id="seller-section">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Cuenta de Vendedor
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between text-left">
                  <div className="max-w-[75%]">
                    <p className="font-medium">Modo Vendedor</p>
                    <p className="text-sm text-muted-foreground">
                      {initialIsSeller 
                        ? "Ya eres un vendedor oficial en el campus. Esta opción no se puede desactivar."
                        : "Al activarlo, podrás publicar tus propios productos y servicios en el Marketplace Unisabana."
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {initialIsSeller && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 h-6">
                        Activo
                      </Badge>
                    )}
                    <Switch 
                      checked={isSeller} 
                      onCheckedChange={(checked) => {
                        if (!initialIsSeller) {
                          setIsSeller(checked);
                        }
                      }}
                      disabled={initialIsSeller}
                    />
                  </div>
                </div>
                
                {!initialIsSeller && isSeller && (
                  <div className="mt-2 p-4 bg-amber-50 border border-amber-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-amber-800 font-medium">
                      ⚠️ Una vez guardes los cambios, te convertirás en vendedor y no podrás revertir esta acción de forma directa.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-8 scroll-mt-24" id="notification-settings">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Preferencias de Notificaciones
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nuevos Mensajes</p>
                    <p className="text-sm text-muted-foreground">Recibe avisos cuando alguien te escriba un chat.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ventas Realizadas</p>
                    <p className="text-sm text-muted-foreground">Notificaciones sobre compras de tus productos.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ofertas y Promociones</p>
                    <p className="text-sm text-muted-foreground">Novedades sobre el marketplace universitario.</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-4 pt-4">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate('/profile')}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Guardar Todos los Cambios
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
