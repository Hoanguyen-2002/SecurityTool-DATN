package com.backend.securitytool.model.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CommonResponse<T> {

    private String status;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public CommonResponse(String status, String message, T data, LocalDateTime timestamp) {
        this.status = status;
        this.message = message;
        this.data = data;
        this.timestamp = timestamp;
    }
}
