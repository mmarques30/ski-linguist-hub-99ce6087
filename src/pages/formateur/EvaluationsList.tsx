import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ClipboardCheck, 
  Calendar, 
  Building2,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Eye,
  Edit
} from "lucide-react";
import { useTestBookingsToEvaluate, useCompletedEvaluations } from "@/hooks/useTestEvaluations";
import { LANGUAGE_FLAGS, LANGUAGE_LABELS, scoreToLevel } from "@/lib/evaluation-utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EvaluationsList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  
  const { data: pendingBookings, isLoading: pendingLoading, refetch: refetchPending } = useTestBookingsToEvaluate();
  const { data: completedBookings, isLoading: completedLoading, refetch: refetchCompleted } = useCompletedEvaluations();

  const handleRefresh = () => {
    refetchPending();
    refetchCompleted();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Évaluations</h1>
            <p className="text-muted-foreground">
              Gérer les évaluations de tests
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                À évaluer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingLoading ? <Skeleton className="h-8 w-12" /> : pendingBookings?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Complétées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedLoading ? <Skeleton className="h-8 w-12" /> : completedBookings?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              À évaluer
              {pendingBookings && pendingBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Complétées
            </TabsTrigger>
          </TabsList>

          {/* Pending Evaluations */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Tests en attente d'évaluation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Candidat</TableHead>
                      <TableHead>École</TableHead>
                      <TableHead>Langue</TableHead>
                      <TableHead>Profession</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : pendingBookings?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            Toutes les évaluations sont à jour !
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingBookings?.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {booking.datetime ? (
                                format(new Date(booking.datetime), "dd/MM/yyyy HH:mm", { locale: fr })
                              ) : (
                                "-"
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {booking.candidate_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {booking.ski_school_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>{LANGUAGE_FLAGS[booking.language || 'all']}</span>
                              <span className="text-sm">
                                {LANGUAGE_LABELS[booking.language || 'all'] || booking.language}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {booking.candidate_profession || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/formateur/evaluation/${booking.id}`)}
                            >
                              Évaluer
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Evaluations */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Évaluations complétées
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Candidat</TableHead>
                      <TableHead>École</TableHead>
                      <TableHead>Langue</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : completedBookings?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            Aucune évaluation complétée
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      completedBookings?.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {booking.datetime ? (
                                format(new Date(booking.datetime), "dd/MM/yyyy HH:mm", { locale: fr })
                              ) : (
                                "-"
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {booking.candidate_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {booking.ski_school_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>{LANGUAGE_FLAGS[booking.language || 'all']}</span>
                              <span className="text-sm">
                                {LANGUAGE_LABELS[booking.language || 'all'] || booking.language}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.score_general !== null && (
                              <Badge variant="default">
                                {booking.score_general}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/formateur/evaluation-view/${booking.evaluation_id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/formateur/evaluation/${booking.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
