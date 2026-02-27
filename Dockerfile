FROM ghcr.io/onecx/docker-spa-base:1.10.0

# Copy nginx configuration
COPY nginx/locations.conf $DIR_LOCATION/locations.conf
COPY nginx/voice-locations.conf.* $DIR_LOCATION/
# Copy application build
COPY dist/onecx-chat-ui/ $DIR_HTML

# Optional extend list of application environments
ENV CONFIG_ENV_EXT_LIST=VOICE_AI_ENABLED,VOICE_BFF_URL

# Application environments default values
ENV BFF_URL=http://onecx-chat-bff:8080/
ENV APP_BASE_HREF=/
ENV VOICE_AI_ENABLED=true
ENV VOICE_BFF_URL=http://localhost:7860/

RUN chmod 775 -R "$DIR_HTML"/assets
USER 1001