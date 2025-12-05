FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/FluxPay.Api/FluxPay.Api.csproj", "src/FluxPay.Api/"]
COPY ["src/FluxPay.Core/FluxPay.Core.csproj", "src/FluxPay.Core/"]
COPY ["src/FluxPay.Infrastructure/FluxPay.Infrastructure.csproj", "src/FluxPay.Infrastructure/"]
RUN dotnet restore "src/FluxPay.Api/FluxPay.Api.csproj"
COPY . .
WORKDIR "/src/src/FluxPay.Api"
RUN dotnet build "FluxPay.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FluxPay.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FluxPay.Api.dll"]
