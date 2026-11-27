package com.hospital.servicedesk.compartido.auditoria;

import com.hospital.servicedesk.security.red.ResolutorIpCliente;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ResolutorContextoActor {

    private static final String PREFIJO_ROL = "ROLE_";
    private final ResolutorIpCliente resolutorIp;

    public ContextoActor resolver(Authentication autenticacion, HttpServletRequest request) {
        String correo = autenticacion != null ? autenticacion.getName() : "sistema";
        String rol = "USUARIO_FINAL";
        if (autenticacion != null) {
            rol = autenticacion.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(a -> a.startsWith(PREFIJO_ROL))
                    .map(a -> a.substring(PREFIJO_ROL.length()))
                    .findFirst()
                    .orElse("USUARIO_FINAL");
        }
        String ip = resolutorIp != null ? resolutorIp.resolverIp(request) : "127.0.0.1";
        return new ContextoActor(correo, rol, ip);
    }
}
