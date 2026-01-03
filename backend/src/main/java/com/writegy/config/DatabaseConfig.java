package com.writegy.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties() {
            @Override
            public void setUrl(String url) {
                if (url != null && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
                    try {
                        URI uri = new URI(url);
                        // Convert postgres://user:pass@host:port/db to jdbc:postgresql://host:port/db
                        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + uri.getPort() + uri.getPath();
                        super.setUrl(jdbcUrl);
                        
                        if (uri.getUserInfo() != null) {
                            String[] auth = uri.getUserInfo().split(":", 2);
                            if (auth.length > 0) this.setUsername(auth[0]);
                            if (auth.length > 1) this.setPassword(auth[1]);
                        }
                        return;
                    } catch (URISyntaxException e) {
                        // Fallback to default behavior if parsing fails
                    }
                }
                super.setUrl(url);
            }
        };
    }

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }
}