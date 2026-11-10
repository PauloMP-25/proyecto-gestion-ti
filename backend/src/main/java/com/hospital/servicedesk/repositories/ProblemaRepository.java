package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.Problema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProblemaRepository extends JpaRepository<Problema, Integer> {
}
