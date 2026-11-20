package com.hospital.servicedesk.administrativo.equipos.aplicacion.impl;

import com.hospital.servicedesk.administrativo.equipos.config.PropiedadesRed;
import com.hospital.servicedesk.administrativo.equipos.dominio.ip.ReglaIpNoReservada;
import com.hospital.servicedesk.administrativo.equipos.dominio.ip.ReglaIpPrivada;
import com.hospital.servicedesk.administrativo.equipos.dominio.ip.ReglaIpv4Estricta;
import com.hospital.servicedesk.administrativo.equipos.dominio.ip.ValidadorIp;
import com.hospital.servicedesk.entities.DireccionIP;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoIP;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.repositories.DireccionIpRepository;
import com.hospital.servicedesk.repositories.HistorialAsignacionIpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AsignacionIpServiceTest {

    @Mock
    private DireccionIpRepository direccionIpRepository;

    @Mock
    private HistorialAsignacionIpRepository historialIpRepository;

    private Clock clock;
    private AsignacionIpServiceImpl asignacionIpService;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-11-20T10:00:00Z"), ZoneId.of("UTC"));
        PropiedadesRed propiedades = new PropiedadesRed(true, true);
        ValidadorIp validadorIp = new ValidadorIp(List.of(
                new ReglaIpv4Estricta(),
                new ReglaIpNoReservada(propiedades),
                new ReglaIpPrivada(propiedades)
        ));

        asignacionIpService = new AsignacionIpServiceImpl(
                direccionIpRepository,
                historialIpRepository,
                validadorIp,
                clock
        );
    }

    @Test
    @DisplayName("Debe asignar exitosamente una IP estática libre al equipo")
    void debeAsignarIpLibre() {
        ElementoConfiguracion pc = ElementoConfiguracion.builder()
                .idCi(1)
                .codigoInventario("PC-ADM-01")
                .build();
        Usuario admin = Usuario.builder().idUsuario(10).correo("admin@hsmsi.gob.pe").build();

        when(historialIpRepository.findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull("192.168.10.12"))
                .thenReturn(Optional.empty());
        when(historialIpRepository.findFirstByElementoConfiguracion_IdCiAndFechaLiberacionIsNull(1))
                .thenReturn(Optional.empty());

        DireccionIP ipEntity = DireccionIP.builder().idDireccionIp(100).direccion("192.168.10.12").estado(EstadoIP.DISPONIBLE).build();
        when(direccionIpRepository.findByDireccion("192.168.10.12")).thenReturn(Optional.of(ipEntity));

        asignacionIpService.asignarIpAEquipo(pc, "192.168.10.12", admin);

        ArgumentCaptor<HistorialAsignacionIP> captor = ArgumentCaptor.forClass(HistorialAsignacionIP.class);
        verify(historialIpRepository).save(captor.capture());

        HistorialAsignacionIP guardada = captor.getValue();
        assertThat(guardada.getDireccionIp().getDireccion()).isEqualTo("192.168.10.12");
        assertThat(guardada.getElementoConfiguracion().getIdCi()).isEqualTo(1);
        assertThat(guardada.getUsuarioAsigno()).isEqualTo(admin);
        assertThat(guardada.getFechaLiberacion()).isNull();
    }

    @Test
    @DisplayName("Debe lanzar ConflictoNegocioException (409) si la IP ya está asignada a otro equipo activo")
    void debeLanzarConflictoSiIpOcupada() {
        ElementoConfiguracion pc1 = ElementoConfiguracion.builder().idCi(1).codigoInventario("PC-ADM-01").build();
        ElementoConfiguracion pc2 = ElementoConfiguracion.builder().idCi(2).codigoInventario("PC-ADM-02").build();
        Usuario admin = Usuario.builder().idUsuario(10).build();

        HistorialAsignacionIP asignacionExistente = HistorialAsignacionIP.builder()
                .idHistorialIp(50)
                .elementoConfiguracion(pc1)
                .direccionIp(DireccionIP.builder().direccion("192.168.10.12").build())
                .build();

        when(historialIpRepository.findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull("192.168.10.12"))
                .thenReturn(Optional.of(asignacionExistente));

        assertThatThrownBy(() -> asignacionIpService.asignarIpAEquipo(pc2, "192.168.10.12", admin))
                .isInstanceOf(ConflictoNegocioException.class)
                .hasMessageContaining("ya está asignada a PC-ADM-01");
    }

    @Test
    @DisplayName("Debe liberar correctamente la IP asignada estableciendo fecha de liberación")
    void debeLiberarIp() {
        ElementoConfiguracion pc = ElementoConfiguracion.builder().idCi(1).codigoInventario("PC-ADM-01").build();
        Usuario admin = Usuario.builder().idUsuario(10).build();

        DireccionIP ip = DireccionIP.builder().idDireccionIp(100).direccion("192.168.10.12").estado(EstadoIP.ASIGNADA).build();
        HistorialAsignacionIP asignacionActiva = HistorialAsignacionIP.builder()
                .idHistorialIp(55)
                .elementoConfiguracion(pc)
                .direccionIp(ip)
                .build();

        when(historialIpRepository.findFirstByElementoConfiguracion_IdCiAndFechaLiberacionIsNull(1))
                .thenReturn(Optional.of(asignacionActiva));
        when(historialIpRepository.existsByDireccionIp_DireccionAndFechaLiberacionIsNull("192.168.10.12"))
                .thenReturn(false);

        asignacionIpService.liberarIpDeEquipo(pc, admin);

        assertThat(asignacionActiva.getFechaLiberacion()).isNotNull();
        assertThat(asignacionActiva.getUsuarioLibero()).isEqualTo(admin);
        verify(historialIpRepository).save(asignacionActiva);
        verify(direccionIpRepository).save(ip);
        assertThat(ip.getEstado()).isEqualTo(EstadoIP.DISPONIBLE);
    }
}
