#!/bin/bash

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' 

echo -e "${BLUE}Iniciando despliegue hacia REPO DE PRODUCCIÓN (segura.git)...${NC}"

# 1. Limpiar y Construir con Vite
echo -e "${GREEN}Paso 1: Compilando y ofuscando el código...${NC}"
npm run build

# 2. Entrar a la carpeta de salida
cd dist

# 3. Inicializar un Git temporal solo para el código compilado
git init
git add .
git commit -m "Deploy producción: $(date +'%Y-%m-%d %H:%M:%S')"

# 4. Añadir el repositorio de producción como destino
# Usamos SSH para evitar problemas de permisos
git remote add production git@github.com:mi-gestion/segura.git

# 5. Forzar la subida al repositorio de producción
echo -e "${GREEN}Paso 2: Subiendo código ofuscado a 'segura.git'...${NC}"
git push -f production main

# 6. Limpieza: salir y borrar el rastro de git en dist para no confundir a Vite
cd ..
rm -rf dist/.git

echo -e "${GREEN}¡Despliegue en producción completado con éxito!${NC}"