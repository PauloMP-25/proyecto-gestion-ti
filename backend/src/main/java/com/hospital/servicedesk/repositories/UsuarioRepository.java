package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    // Método necesario para buscar usuarios por su correo en el login
    Optional<Usuario> findByCorreo(String correo);
}
