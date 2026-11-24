package com.hospital.servicedesk.administrativo.conocimiento.dominio;

import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import com.hospital.servicedesk.entities.ErrorConocido;

import java.util.Comparator;
import java.util.List;

public final class PuntuadorGuias {

    private PuntuadorGuias() {}

    public static int puntuar(ErrorConocido g, List<String> tokens) {
        String titulo = NormalizadorBusqueda.normalizar(g.getTitulo());
        String sintoma = NormalizadorBusqueda.normalizar(g.getSintoma());
        String claves = NormalizadorBusqueda.normalizar(String.join(" ", g.getPalabrasClave()));
        String equipos = NormalizadorBusqueda.normalizar(String.join(" ", g.getEquiposCompatibles()));
        String resumen = NormalizadorBusqueda.normalizar(g.getDescripcionProblema());
        int puntos = 0;
        for (String t : tokens) {
            if (titulo.contains(t))  puntos += 5;
            if (sintoma.contains(t)) puntos += 4;
            if (claves.contains(t))  puntos += 3;
            if (equipos.contains(t)) puntos += 2;
            if (resumen.contains(t)) puntos += 1;
        }
        return puntos;
    }

    public static List<ErrorConocido> ordenar(List<ErrorConocido> guias, List<String> tokens) {
        Comparator<ErrorConocido> porUtilidad = Comparator.comparingInt(ErrorConocido::getConteoUtil).reversed();
        Comparator<ErrorConocido> criterio = tokens.isEmpty() ? porUtilidad
                : Comparator.<ErrorConocido>comparingInt(g -> puntuar(g, tokens)).reversed().thenComparing(porUtilidad);
        return guias.stream().sorted(criterio.thenComparing(ErrorConocido::getIdError)).toList();
    }
}
