# Migration tooling: gcloud (to fetch the dump from GCS), pgloader, and clients
# for both databases. Large, but built once, run for minutes, and never shipped
# to production.
FROM google/cloud-sdk:slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      pgloader \
      mariadb-client \
      postgresql-client \
      gettext-base \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/migrate.sh

ENTRYPOINT ["/app/scripts/migrate.sh"]
