
package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.PrestamoEquipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrestamoEquipoRepository extends JpaRepository<PrestamoEquipo, Integer> {
}

