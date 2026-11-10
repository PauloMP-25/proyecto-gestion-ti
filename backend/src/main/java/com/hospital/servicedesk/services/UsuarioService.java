
package com.hospital.servicedesk.services;

import com.hospital.servicedesk.entities.Usuario;
import java.util.List;
import java.util.Map;

public interface UsuarioService {
    List<Usuario> getTecnicosActivos();
    List<Usuario> getAllUsuarios();
    Usuario createUsuario(Map<String, Object> request);
    Usuario updateUsuario(Integer id, Map<String, Object> request);
    Usuario toggleActivo(Integer id);
    void cambiarContrasena(String email, String nuevaContrasena);
}

