import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Clock, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/useSubjects';
import { SubjectForm } from '@/components/SubjectForm';
import type { Subject, CreateSubjectDto } from '@/services/subjects.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Subjects() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);

  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  // Navegar a la página de tareas con el filtro de esta materia
  const navigateToSubjectTasks = (subjectId: string) => {
    navigate(`/tasks?subject=${subjectId}`);
  };

  const handleCreate = (data: CreateSubjectDto) => {
    createSubject.mutate(data, {
      onSuccess: () => {
        setFormOpen(false);
      },
    });
  };

  const handleUpdate = (data: CreateSubjectDto) => {
    if (editingSubject) {
      updateSubject.mutate(
        { id: editingSubject.subjectId, data },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditingSubject(undefined);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (subjectToDelete) {
      deleteSubject.mutate(subjectToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSubjectToDelete(null);
        },
      });
    }
  };

  const openEditForm = (subject: Subject) => {
    setEditingSubject(subject);
    setFormOpen(true);
  };

  const openDeleteDialog = (subjectId: string) => {
    setSubjectToDelete(subjectId);
    setDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingSubject(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando materias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Materias</h1>
          <p className="text-muted-foreground">Gestiona tus materias del semestre actual</p>
        </div>
        <Button className="shadow-md" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Materia
        </Button>
      </div>

      {subjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes materias registradas</h3>
            <p className="text-muted-foreground mb-4">Comienza agregando tu primera materia</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Materia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const totalTasks = 0; // TODO: Conectar con tasks cuando esté implementado
            const completedTasks = 0;
            const completion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <Card
                key={subject.subjectId}
                className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigateToSubjectTasks(subject.subjectId)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
                      style={{ backgroundColor: subject.color }}
                    >
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(subject);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(subject.subjectId);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {subject.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>{subject.assignedTeacher}</span>
                  </div>
                  {subject.schedule && subject.schedule.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Horarios:</span>
                      </div>
                      {subject.schedule.map((schedule, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground pl-6">
                          {schedule.day}: {schedule.start} - {schedule.end}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{totalTasks} tareas</span>
                    </div>
                    {totalTasks > 0 && (
                      <Badge variant={completion === 100 ? "secondary" : "default"}>
                        {completion}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Formulario */}
      <SubjectForm
        open={formOpen}
        onOpenChange={closeForm}
        onSubmit={editingSubject ? handleUpdate : handleCreate}
        subject={editingSubject}
        isLoading={createSubject.isPending || updateSubject.isPending}
      />

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la materia y todas sus tareas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubject.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
