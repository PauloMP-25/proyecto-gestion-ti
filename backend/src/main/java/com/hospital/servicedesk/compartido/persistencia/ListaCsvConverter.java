package com.hospital.servicedesk.compartido.persistencia;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Converter
public class ListaCsvConverter implements AttributeConverter<List<String>, String> {

    @Override
    public String convertToDatabaseColumn(List<String> lista) {
        return lista == null || lista.isEmpty() ? null : String.join(",", lista);
    }

    @Override
    public List<String> convertToEntityAttribute(String csv) {
        if (csv == null || csv.isBlank()) return new ArrayList<>();
        return new ArrayList<>(Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
    }
}
