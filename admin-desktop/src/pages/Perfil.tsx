import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePartituras } from "../context/PartiturasContext";
import Navbar from "../components/Navbar";
import { User, Music, Heart, Shield, Save, Pencil, Trash2, Search, LogOut, FileText, MessageSquare } from "lucide-react";
import { Usuario } from "../types";
import { authApi, ApiClientError } from "../lib/apiClient";

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
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => { setActiveTab(tabFromUrl); }, [tabFromUrl]);

  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [apellido, setApellido] = useState(user?.apellido ?? "");
  const [email] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState("");
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editRol, setEditRol] = useState<"admin" | "user" | "superadmin">("user");

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; titulo: string } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentUserId = user?.id != null ? String(user.id) : null;
  const misPartituras = currentUserId
    ? partituras.filter((p) => String(p.uploadedBy ?? "") === currentUserId)
    : [];

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
      if (!userId) throw new Error("No se pudo identificar el usuario");
      await authApi.updateUser(userId, { first_name: nombre, last_name: apellido, profile_info: bio });
      updateUser({ id: userId, nombre, apellido, bio });
      showToast("Cambios guardados correctamente");
    } catch (error) {
      if (error instanceof ApiClientError) {
        showToast(error.message || "No se pudo guardar el perfil", "error");
      } else {
        showToast("No se pudo guardar el perfil", "error");
      }
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const me = await authApi.getCurrentUser();
        setNombre(me.first_name || user.nombre || "");
        setApellido(me.last_name || user.apellido || "");
        setBio(me.profile_info || "");
        const fullName = `${me.first_name || ""} ${me.last_name || ""}`.trim();
        updateUser({
          id: me.id,
          nombre: fullName || user.nombre,
          apellido: me.last_name || user.apellido,
          email: me.email || user.email,
          bio: me.profile_info || "",
          role: normalizeRole(me.role_name),
        });
      } catch {
        // Mantener valores locales
      }
    };
    void loadProfile();
  }, [user?.id]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!isAdmin) return;
      try {
        const backendUsers = await authApi.getUsers(100, 0);
        setUsuarios(backendUsers.map((u) => ({
          id: String(u.id),
          nombre: u.first_name,
          apellido: u.last_name,
          email: u.email,
          rol: normalizeRole(u.role_name),
          bio: u.profile_info || "",
        })));
      } catch {
        showToast("No se pudo cargar la lista de usuarios", "error");
      }
    };
    void loadUsers();
  }, [isAdmin]);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const openEditModal = (u: Usuario) => {
    setEditUser(u);
    setEditNombre(u.nombre);
    setEditApellido(u.apellido);
    setEditRol(u.rol);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    if (!isSuperAdmin && editRol !== "user") {
      showToast("Solo superadmin puede asignar roles administrativos", "error");
      return;
    }
    try {
      await authApi.updateUser(Number(editUser.id), {
        first_name: editNombre,
        last_name: editApellido,
        role_id: editRol === "superadmin" ? 3 : editRol === "admin" ? 2 : 1,
      });
      setUsuarios((prev) =>
        prev.map((u) => u.id === editUser.id ? { ...u, nombre: editNombre, apellido: editApellido, rol: editRol } : u)
      );
      setEditUser(null);
      showToast("Usuario actualizado");
    } catch {
      showToast("No se pudo actualizar el usuario", "error");
    }
  };

  const handleEliminarPartitura = (id: string) => {
    eliminarPartitura(id);
    setConfirmDelete(null);
    showToast("Partitura eliminada correctamente");
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      u.apellido.toLowerCase().includes(filtro.toLowerCase())
  );

  if (!user) { navigate("/login", { replace: true }); return null; }

  const tabButtonClass = (tab: string) =>
    `flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
      activeTab === tab
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground hover:bg-secondary/15 hover:text-primary"
    }`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 max-w-sm rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-destructive text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">

        {/* Header de perfil */}
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

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1">
          <button onClick={() => setActiveTab("info")} className={tabButtonClass("info")}>
            <User className="h-4 w-4" /> Información Personal
          </button>
          <button onClick={() => setActiveTab("partituras")} className={tabButtonClass("partituras")}>
            <Music className="h-4 w-4" /> Mis Partituras
          </button>
          <button onClick={() => setActiveTab("favoritos")} className={tabButtonClass("favoritos")}>
            <Heart className="h-4 w-4" /> Mis Favoritos
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab("admin")} className={tabButtonClass("admin")}>
              <Shield className="h-4 w-4" /> Panel Admin
            </button>
          )}
        </div>

        {/* Tab: Información Personal */}
        {activeTab === "info" && (
          <div className="rounded-xl border border-secondary/20 bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-1">Información Personal</h2>
            <p className="text-sm text-muted-foreground mb-6">Actualiza tus datos de perfil</p>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Nombre</label>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Apellido</label>
                  <input
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  value={email}
                  disabled
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground opacity-60 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos sobre ti..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none transition-colors"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleGuardar}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Save className="h-4 w-4" /> Guardar Cambios
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Mis Partituras */}
        {activeTab === "partituras" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {misPartituras.map((p) => (
              <div key={p.id} className="rounded-xl border border-secondary/20 bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={() => navigate(`/partituras/${p.id}`)}
                    className="font-serif text-base font-semibold text-foreground hover:text-primary transition-colors text-left line-clamp-2"
                  >
                    {p.titulo}
                  </button>
                  <span className="ml-2 shrink-0 rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary">
                    {p.genero}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{p.autor} · {p.anio}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>❤️ {p.likes}</span>
                    <span>⬇️ {p.descargas}</span>
                  </div>
                  <button
                    onClick={() => setConfirmDelete({ id: p.id, titulo: p.titulo })}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {misPartituras.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-12">
                No has subido partituras aún.
              </p>
            )}
          </div>
        )}

        {/* Tab: Mis Favoritos */}
        {activeTab === "favoritos" && (
          <div className="space-y-3">
            {favoritas.length > 0 ? (
              favoritas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/partituras/${p.id}`)}
                  className="w-full text-left rounded-xl border border-secondary/20 bg-card p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <Heart className="h-5 w-5 shrink-0 fill-primary text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif font-medium text-foreground truncate">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">{p.autor} · {p.anio}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-secondary/30 px-2.5 py-0.5 text-xs text-foreground">
                    {p.genero}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-12">
                No tienes favoritos aún. Marca partituras como favoritas desde su página de detalle.
              </p>
            )}
          </div>
        )}

        {/* Tab: Panel Admin */}
        {activeTab === "admin" && isAdmin && (
          <div className="rounded-xl border border-secondary/20 bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-1">Gestión de Usuarios</h2>
            <p className="text-sm text-muted-foreground mb-6">Administra los usuarios registrados en la plataforma</p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Buscar por nombre..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
              />
            </div>

            <div className="rounded-lg border border-secondary/20 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary/20 bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Apellido</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Rol</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u) => (
                    <tr key={u.id} className="border-b border-secondary/10 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.id}</td>
                      <td className="px-4 py-3 text-foreground">{u.nombre}</td>
                      <td className="px-4 py-3 text-foreground">{u.apellido}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.rol === "superadmin" ? "bg-primary/15 text-primary" :
                          u.rol === "admin" ? "bg-secondary/15 text-secondary" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="flex items-center gap-1 rounded-lg border border-secondary/30 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => showToast("Eliminar usuarios no está disponible en backend actualmente", "error")}
                            className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usuariosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal de edición de usuario */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditUser(null)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-secondary/20 bg-card p-6 shadow-xl">
            <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Editar Usuario</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <input
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Apellido</label>
                <input
                  value={editApellido}
                  onChange={(e) => setEditApellido(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Rol</label>
                <select
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value as "admin" | "user" | "superadmin")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
                >
                  <option value="user">User</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                  {isSuperAdmin && <option value="superadmin">SuperAdmin</option>}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setEditUser(null)}
                className="rounded-lg border border-secondary/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSave}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar partitura */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-50 w-full max-w-sm rounded-xl border border-secondary/20 bg-card p-6 shadow-xl">
            <h3 className="font-serif text-lg font-semibold text-foreground mb-2">¿Eliminar partitura?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Esta acción no se puede deshacer. Se eliminará permanentemente "{confirmDelete.titulo}".
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-secondary/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarPartitura(confirmDelete.id)}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Perfil;
