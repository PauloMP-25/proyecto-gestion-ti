package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByCorreo(String correo);
    Optional<Usuario> findByCorreoIgnoreCase(String correo);
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);
    boolean existsByCorreoIgnoreCase(String correo);
    boolean existsByNombreUsuarioIgnoreCase(String nombreUsuario);
    long countByArea_IdAreaAndActivoTrue(Integer idArea);
    List<Usuario> findByArea_IdAreaOrderByApellidosAscNombresAsc(Integer idArea);
    List<Usuario> findByArea_IdAreaAndActivoTrueOrderByApellidosAscNombresAsc(Integer idArea);
}
