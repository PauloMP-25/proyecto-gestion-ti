
package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.Categoria;
import com.hospital.servicedesk.repositories.CategoriaRepository;
import com.hospital.servicedesk.services.CategoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaServiceImpl implements CategoriaService {

    private final CategoriaRepository categoriaRepo;

    @Override
    public List<Categoria> getAllCategorias() {
        return categoriaRepo.findAll();
    }

    @Override
    @Transactional
    public Categoria createCategoria(String nombre, Integer idPadre) {
        Categoria padre = null;
        if (idPadre != null) {
            padre = categoriaRepo.findById(idPadre).orElse(null);
        }
        Categoria categoria = Categoria.builder()
                .nombre(nombre)
                .categoriaPadre(padre)
                .build();
        return categoriaRepo.save(categoria);
    }

    @Override
    @Transactional
    public Categoria updateCategoria(Integer id, String nombre, Integer idPadre) {
        Categoria categoria = categoriaRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada"));
        categoria.setNombre(nombre);
        if (idPadre != null) {
            Categoria padre = categoriaRepo.findById(idPadre).orElse(null);
            categoria.setCategoriaPadre(padre);
        } else {
            categoria.setCategoriaPadre(null);
        }
        return categoriaRepo.save(categoria);
    }
}

