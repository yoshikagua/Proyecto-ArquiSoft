/**
 * Perfil.tsx
 * Página de perfil de usuario con tabs: Info Personal, Mis Partituras,
 * Mis Favoritos, y Panel Admin (solo si role es admin o superadmin).
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePartituras } from "@/context/PartiturasContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { User, Music, Heart, Shield, Save, Pencil, Trash2, Search, LogOut, FileText, MessageSquare } from "lucide-react";
import { Usuario } from "@/types";
import { toast } from "sonner";
import { authApi, storageApi,ApiClientError } from "@/lib/apiClient";

const normalizeRole = (roleName?: string): "user" | "admin" | "superadmin" => {
  const normalized = (roleName || "").toLowerCase();
  if (normalized.includes("super")) return "superadmin";
  if (normalized.includes("admin")) return "admin";
  return "user";
};

const Perfil = () => {
  const { user, logout, updateUser } = useAuth();
  const { partituras, favoritas, eliminarPartitura } = usePartituras();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") ?? "info";

  // Controlled tab state that reacts to URL changes
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sync tab when URL search params change (e.g. from navbar dropdown)
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // ── Info Personal ──
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [apellido, setApellido] = useState(user?.apellido ?? "");
  const [email] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  // ── Admin ──
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState("");
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editRol, setEditRol] = useState<"admin" | "user" | "superadmin">("user");

  const currentUserId = user?.id != null ? String(user.id) : null;
  const misPartituras = currentUserId
    ? partituras.filter((partitura) => String(partitura.uploadedBy ?? "") === currentUserId)
    : [];

  // Stats
  const totalPartiturasSubidas = misPartituras.length;
  const totalComentarios = misPartituras.reduce((acc, p) => acc + p.comentarios.length, 0);

  const handleGuardar = async () => {
    if (!user) return;

    try {
      let userId = user.id;
      if (!userId) {
        const me = await authApi.getCurrentUser();
        userId = me.id;
      }

      if (!userId) {
        throw new ApiClientError("No se pudo identificar el usuario actual", 400, {
          message: "Usuario inválido",
        });
      }

      await authApi.updateUser(userId, {
        first_name: nombre,
        last_name: apellido,
        profile_info: bio,
      });

      updateUser({ id: userId, nombre, apellido, bio });
      toast.success("Cambios guardados correctamente");
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error("No se pudo guardar el perfil", {
          description: error.message,
        });
      } else {
        toast.error("No se pudo guardar el perfil");
      }
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const me = await authApi.getCurrentUser();
        const fullName = `${me.first_name || ""} ${me.last_name || ""}`.trim();
        setNombre(me.first_name || user.nombre || "");
        setApellido(me.last_name || user.apellido || "");
        setBio(me.profile_info || "");

        updateUser({
          id: me.id,
          nombre: me.first_name || user.nombre,
          apellido: me.last_name || user.apellido,
          email: me.email || user.email,
          bio: me.profile_info || "",
          role: normalizeRole(me.role_name),
        });
      } catch {
        // Mantener valores locales si falla el fetch de perfil
      }
    };

    void loadProfile();
  }, [user?.id]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!isAdmin) return;

      try {
        const backendUsers = await authApi.getUsers(100, 0);
        setUsuarios(
          backendUsers.map((backendUser) => ({
            id: String(backendUser.id),
            nombre: backendUser.first_name,
            apellido: backendUser.last_name,
            email: backendUser.email,
            rol: normalizeRole(backendUser.role_name),
            bio: backendUser.profile_info || "",
          }))
        );
      } catch {
        toast.error("No se pudo cargar la lista de usuarios");
      }
    };

    void loadUsers();
  }, [isAdmin]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openEditModal = (u: Usuario) => {
    setEditUser(u);
    setEditNombre(u.nombre);
    setEditApellido(u.apellido);
    setEditRol(u.rol);
  };

  const handleEditSave = async () => {
    if (!editUser) return;

    if (!isSuperAdmin && editRol !== "user") {
      toast.error("Solo superadmin puede asignar roles administrativos");
      return;
    }

    try {
      await authApi.updateUser(Number(editUser.id), {
        first_name: editNombre,
        last_name: editApellido,
        role_id: editRol === "superadmin" ? 3 : editRol === "admin" ? 2 : 1,
      });

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? { ...u, nombre: editNombre, apellido: editApellido, rol: editRol }
            : u
        )
      );
      setEditUser(null);
      toast.success("Usuario actualizado");
    } catch {
      toast.error("No se pudo actualizar el usuario");
    }
  };

  const handleDelete = (_id: string) => {
    toast.error("Eliminar usuarios no está disponible en backend actualmente");
  };

// En Perfil_3.tsx, localiza la función handleEliminarPartitura
const handleEliminarPartitura = async (id: string) => {
  try {
    // CAMBIO: Llama al nuevo método deleteScore definido en el paso anterior
    await storageApi.deleteScore(id); 
    
    // 2. Actualizar el estado global de la aplicación (UI)
    eliminarPartitura(id); 
    
    toast.success("Partitura eliminada correctamente de la biblioteca y el servidor");
  } catch (error) {
    console.error("Error al eliminar la partitura:", error);
    toast.error("No se pudo eliminar la partitura del servidor");
  }
};

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      u.apellido.toLowerCase().includes(filtro.toLowerCase())
  );

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 font-serif text-2xl font-bold text-primary">
            {user.avatar}
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold text-foreground">
              {user.nombre} {user.apellido ?? ""}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          {/* Stats badges */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-secondary/20 bg-card px-3 py-2">
              <FileText className="h-4 w-4 text-primary" />
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{totalPartiturasSubidas}</p>
                <p className="text-[10px] text-muted-foreground">Partituras</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-secondary/20 bg-card px-3 py-2">
              <MessageSquare className="h-4 w-4 text-secondary" />
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{totalComentarios}</p>
                <p className="text-[10px] text-muted-foreground">Comentarios</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile stats */}
        <div className="mb-6 flex sm:hidden gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-secondary/20 bg-card px-3 py-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{totalPartiturasSubidas}</span>
            <span className="text-xs text-muted-foreground">Partituras subidas</span>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-secondary/20 bg-card px-3 py-2">
            <MessageSquare className="h-4 w-4 text-secondary" />
            <span className="text-sm font-bold text-foreground">{totalComentarios}</span>
            <span className="text-xs text-muted-foreground">Comentarios</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="info" className="gap-1.5">
              <User className="h-4 w-4" /> Información Personal
            </TabsTrigger>
            <TabsTrigger value="partituras" className="gap-1.5">
              <Music className="h-4 w-4" /> Mis Partituras
            </TabsTrigger>
            <TabsTrigger value="favoritos" className="gap-1.5">
              <Heart className="h-4 w-4" /> Mis Favoritos
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-1.5">
                <Shield className="h-4 w-4" /> Panel Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Tab: Información Personal ── */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Información Personal</CardTitle>
                <CardDescription>Actualiza tus datos de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nombre</label>
                    <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Apellido</label>
                    <Input value={apellido} onChange={(e) => setApellido(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input value={email} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Bio</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Cuéntanos sobre ti..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Button onClick={handleGuardar} className="gap-2">
                    <Save className="h-4 w-4" /> Guardar Cambios
                  </Button>
                  <Button variant="outline" onClick={handleLogout} className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
                    <LogOut className="h-4 w-4" /> Cerrar Sesión
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Mis Partituras ── */}
          <TabsContent value="partituras">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {misPartituras.map((p) => (
                <Card key={p.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle
                        className="font-serif text-base leading-tight cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/partituras/${p.id}`)}
                      >
                        {p.titulo}
                      </CardTitle>
                      <Badge variant="secondary" className="ml-2 shrink-0 text-xs">{p.genero}</Badge>
                    </div>
                    <CardDescription>{p.autor} · {p.anio}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>❤️ {p.likes}</span>
                        <span>⬇️ {p.descargas}</span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar partitura?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente "{p.titulo}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleEliminarPartitura(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {misPartituras.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  No has subido partituras aún.
                </p>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Mis Favoritos ── */}
          <TabsContent value="favoritos">
            <div className="space-y-3">
              {favoritas.length > 0 ? (
                favoritas.map((p) => (
                  <Card
                    key={p.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => navigate(`/partituras/${p.id}`)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <Heart className="h-5 w-5 shrink-0 fill-primary text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="font-serif font-medium text-foreground truncate">{p.titulo}</p>
                        <p className="text-xs text-muted-foreground">{p.autor} · {p.anio}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">{p.genero}</Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No tienes favoritos aún. Marca partituras como favoritas desde su página de detalle.
                </p>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Panel Admin ── */}
          {isAdmin && (
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Gestión de Usuarios</CardTitle>
                  <CardDescription>Administra los usuarios registrados en la plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Apellido</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usuariosFiltrados.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{u.id}</TableCell>
                            <TableCell>{u.nombre}</TableCell>
                            <TableCell>{u.apellido}</TableCell>
                            <TableCell>
                              <Badge variant={u.rol === "user" ? "secondary" : "default"}>
                                {u.rol}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" className="gap-1" onClick={() => openEditModal(u)}>
                                  <Pencil className="h-3.5 w-3.5" /> Editar
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" className="gap-1">
                                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se eliminará permanentemente a {u.nombre} {u.apellido}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {usuariosFiltrados.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No se encontraron usuarios.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Modal de edición */}
              <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif">Editar Usuario</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nombre</label>
                      <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Apellido</label>
                      <Input value={editApellido} onChange={(e) => setEditApellido(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rol</label>
                      <select
                        value={editRol}
                        onChange={(e) => setEditRol(e.target.value as "admin" | "user" | "superadmin")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="user">User</option>
                        {isSuperAdmin && <option value="admin">Admin</option>}
                        {isSuperAdmin && <option value="superadmin">SuperAdmin</option>}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
                    <Button onClick={handleEditSave}>Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Perfil;
