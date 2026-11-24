package com.hospital.servicedesk.compartido.util;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

/** Minúsculas + sin tildes + espacios colapsados. "Admisión  CENTRAL" → "admision central". */
public final class NormalizadorBusqueda {

    private static final Pattern DIACRITICOS = Pattern.compile("\\p{M}+");
    private static final Pattern NO_ALFANUMERICO = Pattern.compile("[^a-z0-9ñ\\- ]");

    private NormalizadorBusqueda() {}

    public static String normalizar(String texto) {
        if (texto == null) return "";
        String sinEnie = texto.replace('ñ', '\u0001').replace('Ñ', '\u0001');        // proteger la ñ
        String sinTildes = DIACRITICOS.matcher(Normalizer.normalize(sinEnie, Normalizer.Form.NFD)).replaceAll("");
        String minusculas = sinTildes.replace('\u0001', 'ñ').toLowerCase(Locale.ROOT);
        return NO_ALFANUMERICO.matcher(minusculas).replaceAll(" ").trim().replaceAll("\\s+", " ");
    }

    public static String componer(String... partes) {
        return normalizar(String.join(" ", Arrays.stream(partes).filter(Objects::nonNull).toList()));
    }

    /** Palabras de 2+ letras, sin repetir. */
    public static List<String> tokens(String consulta) {
        String n = normalizar(consulta);
        return n.isEmpty() ? List.of() :
                Arrays.stream(n.split(" "))
                        .filter(s -> s.length() >= 2)
                        .distinct()
                        .toList();
    }
}
