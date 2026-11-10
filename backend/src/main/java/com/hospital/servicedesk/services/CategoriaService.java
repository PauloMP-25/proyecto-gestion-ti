
package com.hospital.servicedesk.services;

import com.hospital.servicedesk.entities.Categoria;
import java.util.List;

public interface CategoriaService {
    List<Categoria> getAllCategorias();
    Categoria createCategoria(String nombre, Integer idPadre);
    Categoria updateCategoria(Integer id, String nombre, Integer idPadre);
}

