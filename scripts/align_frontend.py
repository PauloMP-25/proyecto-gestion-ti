# 1. Update GuiaSolucionService interface
svc_path = "backend/src/main/java/com/hospital/servicedesk/administrativo/conocimiento/aplicacion/GuiaSolucionService.java"
with open(svc_path, "r", encoding="utf-8") as f:
    code = f.read()
if "cambiarEstadoPublicado" not in code:
    code = code.replace("void archivar(Integer id, ContextoActor ctx);", "void archivar(Integer id, ContextoActor ctx);\n    void cambiarEstadoPublicado(Integer id, boolean publicado, ContextoActor ctx);")
    with open(svc_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Updated GuiaSolucionService interface")

# 2. Update GuiaSolucionServiceImpl
impl_path = "backend/src/main/java/com/hospital/servicedesk/administrativo/conocimiento/aplicacion/impl/GuiaSolucionServiceImpl.java"
with open(impl_path, "r", encoding="utf-8") as f:
    impl_code = f.read()
if "cambiarEstadoPublicado" not in impl_code:
    method = """
    @Override
    @Transactional
    public void cambiarEstadoPublicado(Integer id, boolean publicado, ContextoActor ctx) {
        ErrorConocido g = repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Guía no encontrada: " + id));
        g.setPublicado(publicado);
        g.setFechaActualizacion(LocalDateTime.now(clock));
        repository.save(g);
        log.info("Guía {} estado publicado cambiado a {} por {}", id, publicado, ctx.correo());
    }
"""
    idx = impl_code.rfind('}')
    impl_code = impl_code[:idx] + method + "\n}\n"
    with open(impl_path, "w", encoding="utf-8") as f:
        f.write(impl_code)
    print("Updated GuiaSolucionServiceImpl")

# 3. Update GuiaSolucionController with PATCH /{id}/activo
ctrl_path = "backend/src/main/java/com/hospital/servicedesk/administrativo/conocimiento/api/GuiaSolucionController.java"
with open(ctrl_path, "r", encoding="utf-8") as f:
    ctrl_code = f.read()
if "cambiarActivo" not in ctrl_code:
    patch_method = """
    @PatchMapping("/{id}/activo")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
    public void cambiarActivo(@PathVariable Integer id, @RequestParam boolean activo,
                              Authentication auth, HttpServletRequest request) {
        service.cambiarEstadoPublicado(id, activo, resolutorActor.resolver(auth, request));
    }
"""
    idx = ctrl_code.rfind('}')
    ctrl_code = ctrl_code[:idx] + patch_method + "\n}\n"
    with open(ctrl_path, "w", encoding="utf-8") as f:
        f.write(ctrl_code)
    print("Updated GuiaSolucionController")

# 4. Update SolicitudCambioController with PUT /{id}/decision
rfc_ctrl_path = "backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/api/SolicitudCambioController.java"
with open(rfc_ctrl_path, "r", encoding="utf-8") as f:
    rfc_code = f.read()
if "decidir" not in rfc_code:
    decidir_method = """
    @PutMapping("/{id}/decision")
    public CambioDetalleRespuesta decidir(@PathVariable Integer id,
                                          @Valid @RequestBody TransicionCambioSolicitud transicion,
                                          Authentication auth, HttpServletRequest request) {
        return service.transicionar(id, transicion, resolutorActor.resolver(auth, request));
    }
"""
    idx = rfc_code.rfind('}')
    rfc_code = rfc_code[:idx] + decidir_method + "\n}\n"
    with open(rfc_ctrl_path, "w", encoding="utf-8") as f:
        f.write(rfc_code)
    print("Updated SolicitudCambioController with /decision alias")

