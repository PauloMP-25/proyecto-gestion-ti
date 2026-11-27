package com.hospital.servicedesk.administrativo.conocimiento.aplicacion;

import com.hospital.servicedesk.administrativo.conocimiento.dto.GuiaDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.AmbitoGuia;

import java.util.List;

public interface GuiaSolucionService {
    PaginaRespuesta<GuiaRespuesta> buscar(String texto, Integer categoriaId, AmbitoGuia ambito,
                                          boolean soloPublicas, int pagina, int tamano, ContextoActor ctx);
    List<GuiaRespuesta> destacadas(int limite, ContextoActor ctx);
    GuiaRespuesta obtener(Integer id, ContextoActor ctx);
    List<ConteoCategoriaRespuesta> contarPorCategoria(ContextoActor ctx);
    GuiaRespuesta crear(GuiaFormulario f, ContextoActor ctx);
    GuiaRespuesta actualizar(Integer id, GuiaFormulario f, ContextoActor ctx);
    void archivar(Integer id, ContextoActor ctx);
    void cambiarEstadoPublicado(Integer id, boolean publicado, ContextoActor ctx);
    GuiaRespuesta votar(Integer id, boolean esUtil, ContextoActor ctx);
    void registrarVisita(Integer id, ContextoActor ctx);
}
