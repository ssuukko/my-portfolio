package com.portfolio.deploy.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class VercelDeployHookService implements DeployHookService {

    private final RestClient restClient;
    private final String deployHookUrl;

    public VercelDeployHookService(
            RestClient.Builder restClientBuilder,
            @Value("${vercel.deploy-hook-url:}") String deployHookUrl
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = restClientBuilder
                .requestFactory(requestFactory)
                .build();
        this.deployHookUrl = deployHookUrl;
    }

    @Async
    @Override
    public void triggerPortfolioDeploy() {
        if (deployHookUrl == null || deployHookUrl.isBlank()) {
            log.debug("Vercel deploy hook URL is not configured. Skipping deploy trigger.");
            return;
        }

        try {
            restClient.post()
                    .uri(deployHookUrl)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Triggered Vercel deploy hook.");
        } catch (Exception exception) {
            log.warn("Failed to trigger Vercel deploy hook: {}", exception.getMessage());
        }
    }
}
