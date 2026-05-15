import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, CheckCircle, XCircle, User, Box, Loader2, AlertCircle } from 'lucide-react';
import { adminService, AdminReport } from '../services/adminService';
import { userService, UserProfileResponse } from '../services/userService';
import { productService, Product } from '../services/productService';
import { Label } from './ui/label';
import { toast } from 'sonner';
import Base64ImageLoader from './Base64ImageLoader';
import { Avatar, AvatarFallback } from './ui/avatar';

export function AdminReportView() {
  const { id: reportID } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [report, setReport] = useState<AdminReport | null>(null);
  const [reporter, setReporter] = useState<UserProfileResponse | null>(null);
  const [reportedEntity, setReportedEntity] = useState<Product | UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [status, setStatus] = useState<'pending' | 'resolved'>('pending');
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionType, setResolutionType] = useState<'deleteOffending' | 'rejectReport' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!reportID) return;
      try {
        setLoading(true);
        const reportData = await adminService.getReport(reportID);
        setReport(reportData);

        // Fetch reporter
        try {
          const reporterData = await userService.getProfileByUid(reportData.reporterID);
          setReporter(reporterData);
        } catch (e) {
          console.error('Error fetching reporter info:', e);
        }

        // Fetch reported entity
        try {
          if (reportData.type === 'productReport') {
            const productData = await productService.getProduct(reportData.reportedID);
            setReportedEntity(productData);
          } else {
            const userData = await userService.getProfileByUid(reportData.reportedID);
            setReportedEntity(userData);
          }
        } catch (e) {
          console.error('Error fetching reported entity info:', e);
        }

      } catch (error) {
        console.error('Error fetching report:', error);
        toast.error('No se pudo cargar el detalle del reporte');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reportID]);

  function handleStartResolve(type: 'deleteOffending' | 'rejectReport') {
    setResolutionType(type);
    setShowResolutionForm(true);
    setReason('');
  }

  function handleViewItem() {
    if (!report) return;
    if (report.type === 'productReport') {
      navigate(`/product/${report.reportedID}`);
    } else {
      navigate(`/profile/${report.reportedID}`);
    }
  }

  async function handleConfirmResolution() {
    if (!reportID || !resolutionType) return;
    if (!reason.trim()) {
      toast.error('Por favor ingresa un motivo para la acción');
      return;
    }

    try {
      setResolving(true);
      const res = await adminService.resolveReport(reportID, resolutionType, reason);
      toast.success(res.message);
      setStatus('resolved');
      setShowResolutionForm(false);
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Error al resolver el reporte');
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Reporte no encontrado</h2>
        <Button onClick={() => navigate('/admin')}>Volver al Panel</Button>
      </div>
    );
  }

  const reportedName = report.type === 'productReport' 
    ? (reportedEntity as Product)?.name || 'Producto Desconocido'
    : (reportedEntity as UserProfileResponse)?.username || 'Usuario Desconocido';

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-primary">Detalle del Reporte</h2>
              <p className="text-sm text-muted-foreground">Revisa el reporte y toma una acción</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mr-2">
              ID #{report.reportID.substring(0, 8)}...
            </Badge>
            <Badge
              variant={status === 'pending' ? 'outline' : 'default'}
            >
              {status === 'pending' ? 'Pendiente' : 'Resuelto'}
            </Badge>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{report.type === 'productReport' ? 'Producto' : 'Usuario'}</Badge>
                <Badge variant="destructive">Prioridad Alta</Badge>
              </div>
              <h3 className="text-xl font-semibold mb-2">{report.reportTitle}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Reportado {reporter ? `por ${reporter.username}` : 'por Usuario Anónimo'}
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg mb-6 border">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descripción del Problema</h4>
                <p className="text-primary italic leading-relaxed">&quot;{report.reportBody}&quot;</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  Objeto del Reporte
                </h4>
                <Card className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/5 rounded flex items-center justify-center border overflow-hidden">
                      {report.type === 'productReport' ? (
                        (reportedEntity as Product)?.images && (reportedEntity as Product).images[0] ? (
                          <Base64ImageLoader data={(reportedEntity as Product).images[0]} alt={reportedName} className="w-full h-full object-cover" />
                        ) : (
                          <Box className="w-8 h-8 text-primary" />
                        )
                      ) : (
                        <Avatar className="w-full h-full rounded-none">
                          {(reportedEntity as UserProfileResponse)?.photo ? (
                            <Base64ImageLoader data={(reportedEntity as UserProfileResponse).photo!} alt={reportedName} className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold rounded-none w-full h-full">
                              {reportedName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{reportedName}</p>
                      <p className="text-xs text-muted-foreground">ID: {report.reportedID}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleViewItem}>
                    Ver Detalles
                  </Button>
                </Card>
              </div>
            </div>

            <aside className="w-full md:w-80">
              <Card className="p-4 mb-4 text-left">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Informante</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center border border-primary/20">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{reporter?.username || 'Cargando...'}</p>
                    <p className="text-xs text-muted-foreground">{reporter?.career || 'Estudiante'}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 text-left">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Acciones Administrativas</h4>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => handleStartResolve('deleteOffending')} 
                    size="sm" 
                    variant="destructive" 
                    disabled={status !== 'pending' || resolving}
                    className="w-full"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> 
                    {report.type === 'productReport' ? 'Eliminar Producto' : 'Suspender Usuario'}
                  </Button>
                  <Button 
                    onClick={() => handleStartResolve('rejectReport')} 
                    size="sm" 
                    variant="outline" 
                    disabled={status !== 'pending' || resolving}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Rechazar Reporte
                  </Button>

                  {showResolutionForm && (
                    <div className="space-y-3 pt-3 border-t mt-2">
                      <Label className="text-xs font-bold text-primary">
                        MOTIVO DE LA {resolutionType === 'deleteOffending' ? 'ACCIÓN' : 'RECHAZO'}
                      </Label>
                      <textarea
                        className="w-full rounded-md border bg-background p-2 text-sm min-h-[100px]"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={resolutionType === 'deleteOffending' ? "Explica por qué se toma esta medida disciplinaria..." : "Explica por qué este reporte no procede..."}
                        disabled={resolving}
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={resolutionType === 'deleteOffending' ? "destructive" : "default"} 
                          onClick={handleConfirmResolution} 
                          className="flex-1"
                          disabled={resolving}
                        >
                          {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowResolutionForm(false)} className="flex-1" disabled={resolving}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {status === 'resolved' && (
                <div className="mt-4 p-4 bg-muted rounded-lg border-2 border-dashed flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 border shadow-sm">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-bold text-sm uppercase tracking-tight">Reporte Resuelto</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    La acción administrativa ha sido procesada correctamente.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </Card>
      </div>
    </div>
  );
}
