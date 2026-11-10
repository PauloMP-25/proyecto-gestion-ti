package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ticket_error_conocido")
public class TicketErrorConocido {

    @EmbeddedId
    private TicketErrorConocidoId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idTicket")
    @JoinColumn(name = "id_ticket")
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idErrorConocido")
    @JoinColumn(name = "id_error_conocido")
    private ErrorConocido errorConocido;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class TicketErrorConocidoId implements Serializable {
        @Column(name = "id_ticket")
        private Integer idTicket;

        @Column(name = "id_error_conocido")
        private Integer idErrorConocido;
    }
}
