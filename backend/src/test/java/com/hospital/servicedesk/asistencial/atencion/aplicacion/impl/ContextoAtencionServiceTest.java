package com.hospital.servicedesk.asistencial.atencion.aplicacion.impl;

import com.hospital.servicedesk.administrativo.areas.dominio.FormateadorUbicacion;
import com.hospital.servicedesk.asistencial.atencion.dominio.EstadoDeteccion;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.asistencial.atencion.mapper.ContextoAtencionMapper;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.DireccionIpRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.HistorialAsignacionIpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContextoAtencionServiceTest {

    @Mock
    private HistorialAsignacionIpRepository historialIpRepository;

    @Mock
    private DireccionIpRepository direccionIpRepository;

    @Mock
    private ElementoConfiguracionRepository elementoRepository;

    private ContextoAtencionServiceImpl service;

    private Area admision;
    private Area emergencia;
    private ElementoConfiguracion pcAdmision;
    private ElementoConfiguracion impresoraAdmision;
    private Usuario patricia;

    @BeforeEach
    void setUp() {
        ContextoAtencionMapper mapper = new ContextoAtencionMapper(new FormateadorUbicacion());
        service = new ContextoAtencionServiceImpl(
                historialIpRepository,
                direccionIpRepository,
                elementoRepository,
                mapper
        );

        admision = Area.builder()
                .idArea(1)
                .nombre("Admisión")
                .piso("1")
                .referenciaUbicacion("Frente a Jefatura de Estadística")
                .anexo("105")
                .activo(true)
                .build();

        emergencia = Area.builder()
                .idArea(2)
                .nombre("Emergencia")
                .piso("1")
                .anexo("110")
                .activo(true)
                .build();

        pcAdmision = ElementoConfiguracion.builder()
                .idCi(10)
                .codigoInventario("PC-ADM-02")
                .nombre("Computadora Admisión 2")
                .tipoCi(TipoCI.COMPUTADORA)
                .referenciaUbicacion("Ventanilla 2")
                .area(admision)
                .estado(EstadoCI.ACTIVO)
                .build();

        impresoraAdmision = ElementoConfiguracion.builder()
                .idCi(20)
                .codigoInventario("IMP-ADM-01")
                .nombre("Impresora Admisión 1")
                .tipoCi(TipoCI.IMPRESORA)
                .referenciaUbicacion("Junto a Ventanilla 1")
                .area(admision)
                .estado(EstadoCI.ACTIVO)
                .build();

        patricia = Usuario.builder()
                .idUsuario(5)
                .nombres("Patricia")
                .apellidos("Ramos")
                .gradoProfesional(GradoProfesional.LIC)
                .correo("pramos@hsmsi.gob.pe")
                .area(admision)
                .activo(true)
                .build();
    }

    @Test
    @DisplayName("Escenario 1: IP con equipo activo y área activa debe resolver estado DETECTADO con impresoras")
    void debeResolverContextoDetectado() {
        DireccionIP ipEntity = DireccionIP.builder().idDireccionIp(1).direccion("192.168.10.12").build();
        HistorialAsignacionIP asignacionPc = HistorialAsignacionIP.builder()
                .idHistorialIp(1)
                .direccionIp(ipEntity)
                .elementoConfiguracion(pcAdmision)
                .build();

        when(historialIpRepository.findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull("192.168.10.12"))
                .thenReturn(Optional.of(asignacionPc));

        // Impresora activa en Admisión
        when(elementoRepository.findByAreaIdAreaAndTipoCiAndEstado(1, TipoCI.IMPRESORA, EstadoCI.ACTIVO))
                .thenReturn(List.of(impresoraAdmision));

        DireccionIP ipImp = DireccionIP.builder().direccion("192.168.10.21").build();
        HistorialAsignacionIP asignacionImp = HistorialAsignacionIP.builder()
                .direccionIp(ipImp)
                .elementoConfiguracion(impresoraAdmision)
                .build();

        when(historialIpRepository.findFirstByElementoConfiguracion_IdCiAndFechaLiberacionIsNull(20))
                .thenReturn(Optional.of(asignacionImp));

        ContextoAtencionRespuesta res = service.resolver("192.168.10.12", patricia);

        assertThat(res.estadoDeteccion()).isEqualTo(EstadoDeteccion.DETECTADO);
        assertThat(res.ipOrigen()).isEqualTo("192.168.10.12");
        assertThat(res.equipo()).isNotNull();
        assertThat(res.equipo().codigoInventario()).isEqualTo("PC-ADM-02");
        assertThat(res.area()).isNotNull();
        assertThat(res.area().nombre()).isEqualTo("Admisión");
        assertThat(res.area().ubicacionLegible()).isEqualTo("Primer Piso");
        assertThat(res.impresorasArea()).hasSize(1);
        assertThat(res.impresorasArea().get(0).codigoInventario()).isEqualTo("IMP-ADM-01");
        assertThat(res.impresorasArea().get(0).ipEstatica()).isEqualTo("192.168.10.21");
        assertThat(res.persona().nombreVisible()).isEqualTo("Lic. Patricia Ramos");
        assertThat(res.personaEnOtraArea()).isFalse();
    }

    @Test
    @DisplayName("Escenario 2: Colaborador de Admisión reportando desde Emergencia marca personaEnOtraArea = true")
    void debeMarcarPersonaEnOtraArea() {
        ElementoConfiguracion pcEmergencia = ElementoConfiguracion.builder()
                .idCi(30)
                .codigoInventario("PC-EME-01")
                .nombre("Computadora Triaje")
                .tipoCi(TipoCI.COMPUTADORA)
                .area(emergencia)
                .estado(EstadoCI.ACTIVO)
                .build();

        DireccionIP ipEme = DireccionIP.builder().direccion("192.168.20.10").build();
        HistorialAsignacionIP asignacionEme = HistorialAsignacionIP.builder()
                .direccionIp(ipEme)
                .elementoConfiguracion(pcEmergencia)
                .build();

        when(historialIpRepository.findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull("192.168.20.10"))
                .thenReturn(Optional.of(asignacionEme));
        when(elementoRepository.findByAreaIdAreaAndTipoCiAndEstado(2, TipoCI.IMPRESORA, EstadoCI.ACTIVO))
                .thenReturn(List.of());

        ContextoAtencionRespuesta res = service.resolver("192.168.20.10", patricia);

        assertThat(res.estadoDeteccion()).isEqualTo(EstadoDeteccion.DETECTADO);
        assertThat(res.area().nombre()).isEqualTo("Emergencia");
        assertThat(res.personaEnOtraArea()).isTrue();
    }

    @Test
    @DisplayName("Escenario 3: IP registrada en subred pero sin equipo asignado retorna IP_SIN_EQUIPO")
    void debeResolverIpSinEquipo() {
        when(historialIpRepository.findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull("192.168.10.50"))
                .thenReturn(Optional.empty());
        when(direccionIpRepository.findByDireccion("192.168.10.50"))
                .thenReturn(Optional.of(DireccionIP.builder().direccion("192.168.10.50").build()));

        ContextoAtencionRespuesta res = service.resolver("192.168.10.50", patricia);

        assertThat(res.estadoDeteccion()).isEqualTo(EstadoDeteccion.IP_SIN_EQUIPO);
        assertThat(res.equipo()).isNull();
        assertThat(res.area()).isNull();
        assertThat(res.impresorasArea()).isEmpty();
    }

    @Test
    @DisplayName("Escenario 4: IP no registrada en el catálogo de red retorna IP_NO_REGISTRADA")
    void debeResolverIpNoRegistrada() {
        when(historialIpRepository.findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull("192.168.99.99"))
                .thenReturn(Optional.empty());
        when(direccionIpRepository.findByDireccion("192.168.99.99"))
                .thenReturn(Optional.empty());

        ContextoAtencionRespuesta res = service.resolver("192.168.99.99", patricia);

        assertThat(res.estadoDeteccion()).isEqualTo(EstadoDeteccion.IP_NO_REGISTRADA);
        assertThat(res.equipo()).isNull();
        assertThat(res.area()).isNull();
    }
}
