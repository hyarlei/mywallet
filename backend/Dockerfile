# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar arquivo de projeto e restaurar dependências
COPY ["MyWallet.API.csproj", "./"]
RUN dotnet restore "MyWallet.API.csproj"

# Copiar todo o código e compilar
COPY . .
RUN dotnet build "MyWallet.API.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "MyWallet.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Instalar ferramentas EF Core para migrations
RUN dotnet tool install --global dotnet-ef --version 8.0.*
ENV PATH="${PATH}:/root/.dotnet/tools"

COPY --from=publish /app/publish .

# Expor porta
EXPOSE 5296

# Comando de inicialização com migrations
ENTRYPOINT ["dotnet", "MyWallet.API.dll"]
