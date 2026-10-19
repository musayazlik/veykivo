# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Veykivo.slnx ./
COPY Veykivo.Domain/Veykivo.Domain.csproj Veykivo.Domain/
COPY Veykivo.Application/Veykivo.Application.csproj Veykivo.Application/
COPY Veykivo.Infrastructure/Veykivo.Infrastructure.csproj Veykivo.Infrastructure/
COPY Veykivo.Api/Veykivo.Api.csproj Veykivo.Api/
RUN dotnet restore Veykivo.Api/Veykivo.Api.csproj
COPY . .
RUN dotnet publish Veykivo.Api/Veykivo.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080 \
    Storage__RootPath=/data/uploads \
    DataProtection__KeysPath=/data/keys
COPY --from=build /app .
# Npgsql açılışta GSSAPI kütüphanesini arar; yoksa her başlangıçta hata satırı loglar.
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /data/uploads /data/keys && chown -R app:app /data
USER app
EXPOSE 8080
# Runtime imajında curl/wget yok; bash'in /dev/tcp desteğiyle /health kontrol edilir.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080 && printf "GET /health HTTP/1.0\r\n\r\n" >&3 && grep -q Healthy <&3' || exit 1
ENTRYPOINT ["dotnet", "Veykivo.Api.dll"]
