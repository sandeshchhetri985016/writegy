# ADR 003: LanguageTool for NLP

## Status

Accepted

## Context

Writegy requires a Natural Language Processing (NLP) component for grammar and style checking. We need a solution that is accurate, easy to integrate, and has a free tier suitable for an MVP.

## Decision

We have chosen to use the **LanguageTool API** for our initial NLP and grammar checking needs.

## Consequences

### Positive

*   **Free Tier:** LanguageTool provides a public API with a free tier that is sufficient for the MVP.
*   **Easy Integration:** It's a simple REST API that can be easily called from our Spring Boot backend.
*   **High Quality:** LanguageTool is a mature and powerful open-source grammar checker that supports multiple languages.
*   **No Self-Hosting:** We don't need to host our own NLP model, which saves on infrastructure costs and complexity.

### Negative

*   **Network Latency:** As we are relying on an external API, there will be network latency for each request.
*   **Rate Limiting:** The free public API has rate limits, which could be a bottleneck if the application usage grows.
*   **Limited Customization:** We cannot customize the grammar rules or the NLP model.
*   **Data Privacy:** Sending user-generated content to a third-party service has data privacy implications that need to be considered and communicated to the user.

### Mitigation of Negatives

*   To reduce network latency and avoid hitting rate limits, we will implement a **Caffeine Cache** on the backend. This will cache the results of grammar checks for a certain period, so we don't need to call the API for the same text repeatedly.
*   If we outgrow the free tier, we can either upgrade to a paid plan or consider self-hosting the LanguageTool server.
*   For the MVP, the data privacy implications are acceptable, but we should add a note about this in our terms of service and privacy policy in the future.
