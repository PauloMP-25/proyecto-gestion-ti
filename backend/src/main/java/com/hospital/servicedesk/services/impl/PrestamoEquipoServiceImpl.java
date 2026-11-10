package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.PrestamoEquipo;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.PrestamoEquipoRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.services.PrestamoEquipoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrestamoEquipoServiceImpl implements PrestamoEquipoService {

    private final PrestamoEquipoRepository prestamoRepo;
    private final ElementoConfiguracionRepository ciRepo;
    private final UsuarioRepository usuarioRepo;

    @Override
    public List<PrestamoEquipo> getAllPrestamos() {
        return prestamoRepo.findAll();
    }

    @Override
    public PrestamoEquipo getPrestamoById(Integer id) {
        return prestamoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Préstamo no encontrado"));
    }

    @Override
    @Transactional
    public PrestamoEquipo crearPrestamo(Integer idCi, Integer idTicket, String solicitante, String fechaDevolucionEsperada) {
        ElementoConfiguracion ci = ciRepo.findById(idCi)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Elemento de configuración no encontrado"));

        Usuario receptor = usuarioRepo.findAll().stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay usuarios en el sistema"));

        PrestamoEquipo prestamo = PrestamoEquipo.builder()
                .elementoConfiguracion(ci)
                .usuarioReceptor(receptor)
                .usuarioTecnico(receptor)
                .build();

        return prestamoRepo.save(prestamo);
    }

    @Override
    @Transactional
    public PrestamoEquipo devolverPrestamo(Integer id) {
        PrestamoEquipo prestamo = getPrestamoById(id);
        prestamo.setFechaDevolucion(LocalDateTime.now());
        return prestamoRepo.save(prestamo);
    }
}
