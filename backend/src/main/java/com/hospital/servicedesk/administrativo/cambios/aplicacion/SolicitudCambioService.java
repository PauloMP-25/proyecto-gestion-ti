package com.hospital.servicedesk.administrativo.cambios.aplicacion;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.*;

import java.util.List;

public interface SolicitudCambioService {
    List<CambioResumenRespuesta> listar(EstadoCambio estado, ImpactoAsistencial impacto, TipoCambio tipo, String texto);
    CambioDetalleRespuesta obtener(Integer id);
    CambioDetalleRespuesta crear(SolicitudCambioFormulario formulario, ContextoActor ctx);
    CambioDetalleRespuesta actualizar(Integer id, SolicitudCambioFormulario formulario, ContextoActor ctx);
    CambioDetalleRespuesta transicionar(Integer id, TransicionCambioSolicitud transicion, ContextoActor ctx);
    void eliminar(Integer id, ContextoActor ctx);
    List<AreaAfectadaRespuesta> listarAreasSeleccionables();
}
