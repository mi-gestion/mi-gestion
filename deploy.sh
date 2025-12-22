#!/bin/bash

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Iniciando proceso de despliegue...${NC}"

# 1. Limpiar y Construir
echo -e "${GREEN}Paso 1: Compilando y ofuscando el código con Vite...${NC}"
npm run build

# 2. Confirmación de despliegue
echo -e "${BLUE}La compilación ha terminado en la carpeta /dist.${NC}"
read -p "¿Deseas subir estos cambios a GitHub ahora? (s/n): " confirm

if [ "$confirm" = "s" ]; then
    echo -e "${GREEN}Paso 2: Subiendo a GitHub...${NC}"
    
    # Aquí puedes ajustar si quieres subir la carpeta /dist a una rama específica
    # O simplemente hacer push de todo el repo. 
    # Lo más común para GitHub Pages es subir el contenido de /dist
    
    git add .
    read -p "Mensaje del commit: " message
    git commit -m "$message"
    git push origin main
    
    echo -e "${GREEN}¡Despliegue completado con éxito!${NC}"
else
    echo -e "${BLUE}Despliegue cancelado por el usuario.${NC}"
fi