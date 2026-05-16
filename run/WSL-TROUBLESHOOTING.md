# GUÍA DE TROUBLESHOOTING: L1 RTGS EN WSL
## Diagnóstico y Soluciones para Problemas Comunes

### PREREQUISITOS: WSL Health Check Previo a Deployment

Antes de intentar cualquier deployment, ejecuta estos comandos en WSL:

```bash
# 1. Verificar que IPv6 está deshabilitado
cat /proc/sys/net/ipv6/conf/all/disable_ipv6
# Resultado esperado: 1

# Si no es 1, ejecutar:
echo 1 | sudo tee /proc/sys/net/ipv6/conf/all/disable_ipv6 > /dev/null
echo "net.ipv6.conf.all.disable_ipv6 = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 2. Verificar DNS
cat /etc/resolv.conf
# Resultado esperado: nameserver 1.1.1.1 (Cloudflare)
#                    nameserver 8.8.8.8 (Google)

# Si no está correcto, editar:
sudo tee /etc/resolv.conf > /dev/null <<EOF
nameserver 1.1.1.1
nameserver 8.8.8.8
EOF

# 3. Verificar MTU
ip link show eth0 | grep mtu
# Resultado esperado: mtu 1350

# Si es mayor a 1350:
sudo ip link set dev eth0 mtu 1350

# 4. Verificar almacenamiento disponible
df -h | grep -E "dev/root|home"
# Resultado esperado: >10GB disponible
```

---

## PROBLEMAS COMUNES Y SOLUCIONES

### PROBLEMA 1: "context deadline exceeded" en bootstrap

**Síntomas:**
```
Error creating blockchain: context deadline exceeded
Bootstrapping timed out after 10 minutes
```

**Causas Posibles:**
- IPv6 habilitado en WSL (fuerza TLS handshakes lentos)
- DNS resolver inestable
- MTU 1500 causando fragmentación
- Go module downloads bloqueados por proxy

**Solución:**

```bash
# Paso 1: Deshabilitar IPv6
echo 1 | sudo tee /proc/sys/net/ipv6/conf/all/disable_ipv6
echo "net.ipv6.conf.all.disable_ipv6 = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Paso 2: Fijar DNS explícitamente
sudo tee /etc/resolv.conf > /dev/null <<EOF
nameserver 1.1.1.1
nameserver 8.8.8.8
EOF

# Paso 3: Reducir MTU
sudo ip link set dev eth0 mtu 1350

# Paso 4: Usar proxy de Go alternativo
export GOPROXY=https://goproxy.cn,direct
go mod download

# Paso 5: Aumentar timeout de CLI
export AVALANCHE_CLI_NETWORK_TIMEOUT=20m

# Paso 6: Reintentar deployment
bash deploy-rtgs-l1.sh
```

---

### PROBLEMA 2: "vmFactory was not found"

**Síntomas:**
```
Error: error creating chain ... vmFactory 'rVchnHJrUDu5995QZPZnbYG6bpsceRHmfps3kRr6TpUpqc9NA' was not found
```

**Causa:**
La CLI genera un VMID único para cada blockchain, pero el binario tiene un nombre fijo.

**Solución:**

```bash
# El script deploy-rtgs-l1.sh lo maneja automáticamente, pero si falla:

# Paso 1: Obtener VMID correcto
VMID=$(avalanche blockchain describe rtgs-l1 | grep "VM ID" | awk -F'|' '{print $3}' | xargs)
echo "VMID encontrado: $VMID"

# Paso 2: Copiar binario al nombre correcto
PRECOMPILE_BINARY="/home/blasmov/.avalanchego/plugins/srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy"
PLUGIN_PATH="/home/blasmov/.avalanchego/plugins/$VMID"

cp "$PRECOMPILE_BINARY" "$PLUGIN_PATH"
chmod +x "$PLUGIN_PATH"

# Paso 3: Reintentar deployment
avalanche blockchain deploy rtgs-l1 --local
```

---

### PROBLEMA 3: "Address already in use" en puerto 9650

**Síntomas:**
```
Error: bind: address already in use
Port 9650 is already in use
```

**Solución:**

```bash
# Forzar kill de procesos avalanchego
pkill -9 -f avalanchego

# Liberar puertos específicos
sudo fuser -k 9650/tcp 9651/tcp 9652/tcp 9653/tcp 9654/tcp

# Esperar 5 segundos
sleep 5

# Verificar que los puertos están libres
sudo netstat -tlnp | grep -E "9650|9651|9652|9653|9654"
# Resultado esperado: lista vacía

# Reintentar
bash deploy-rtgs-l1.sh
```

---

### PROBLEMA 4: "TLS handshake timeout" en Go downloads

**Síntomas:**
```
Error: TLS handshake timeout
Downloading go.mod: i/o timeout
```

**Causa:**
WSL intenta resolver DNS con IPv6 primero, lo cual falla en WSL.

**Solución:**

```bash
# Opción A: Usar proxy alternativo de China (rápido)
export GOPROXY=https://goproxy.cn,direct

# Opción B: Pre-descargar módulos críticos
go env -w GOPROXY=https://proxy.golang.org,direct
go mod download github.com/ava-labs/avalanchego

# Opción C: Forzar IPv4 en curl
export CURL_FLAGS="-4"
export GOPROXY_FLAGS="-4"

# Recomendación: Ejecutar precompile-evm build antes
cd ~/precompile-evm
export GOPROXY=https://goproxy.cn,direct
./scripts/build.sh

# Esperar completamente (puede tomar 30+ minutos en WSL)
```

---

### PROBLEMA 5: "No space left on device"

**Síntomas:**
```
Error: no space left on device
Disk full error during compilation
```

**Solución:**

```bash
# Verificar espacio
df -h

# Liberar espacio (WSL cache)
rm -rf ~/.cache/go-build
rm -rf /tmp/*

# Si precompile-evm es muy grande (~60MB):
du -sh ~/.avalanchego/plugins/
# Si supera 500MB, limpiar binarios antiguos:
rm -rf ~/.avalanchego/plugins/*.backup

# Extender partición WSL (en PowerShell)
# wsl --shutdown
# diskpart
# > list disk
# > select disk X
# > extend
```

---

### PROBLEMA 6: Red lenta / timeouts frecuentes

**Síntomas:**
```
Nodes not responding
Blockchain not syncing
RPC calls timeout frequently
```

**Diagnóstico:**

```bash
# 1. Verificar procesos de CPU
top -p $(pgrep -f avalanchego | tr '\n' ',')

# 2. Verificar conexiones de red
ss -s
netstat -an | grep 9650

# 3. Verificar discos
iostat -x 1 5

# 4. Verificar memoria
free -h

# 5. Verificar si avalanchego está corriendorealmente
ps aux | grep avalanchego

# 6. Ver logs en vivo
tail -f ~/.avalanche-cli/local/rtgs-l1-local-node-local-network/NodeID-*/logs/main.log
```

**Soluciones:**

```bash
# A. Reducir carga: frenar validadores existentes
pkill -STOP -f avalanchego
sleep 30
pkill -CONT -f avalanchego

# B. Aumentar recursos (en PowerShell, editar .wslconfig)
# Parar WSL completamente
wsl --shutdown

# Editar %USERPROFILE%\.wslconfig
[wsl2]
memory=8GB
processors=4
swap=2GB
localhostForwarding=true

# Reiniciar WSL
wsl

# C. Limpiar caché de blockchain
rm -rf ~/.avalanche-cli/local/rtgs-l1*/NodeID-*/db

# D. Reducir tamaño de logs
rm -f ~/.avalanche-cli/local/rtgs-l1*/NodeID-*/logs/*.log.*
```

---

### PROBLEMA 7: Blockchain no se sincroniza con Fuji (Teleporter)

**Síntomas:**
```
Teleporter messages not being received
Bridge contract not creating mints
Cross-chain verification failing
```

**Solución:**

```bash
# 1. Verificar que Warp está habilitado en genesis
cat ~/Team1Latam-Hackathon/run/genesis-rtgs-l1.json | grep -A2 "warpConfig"
# Resultado esperado: "blockTimestamp": 0, "quorumPercentage": 67

# 2. Verificar que Teleporter está disponible en RPC
curl -X POST http://127.0.0.1:9654/ext/bc/[BLOCKCHAIN_ID]/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_call",
    "params": [{
      "to": "0x0200000000000000000000000000000000000005",
      "data": "0x" // Empty call to test precompile
    }, "latest"]
  }'

# 3. Verificar que ambos validadores están en acuerdo
ps aux | grep avalanchego | grep -c "node"
# Resultado esperado: 2

# 4. Si fallan los tests de Teleporter:
# - Registrar L1 en el Sistema de Teleporter (requiere contrato en Fuji)
# - Configurar validadores como observadores de L1 Privada
# - Usar testnet de Teleporter primero (no mainnet)
```

---

### PROBLEMA 8: "Out of memory" durante compilación de precompile-evm

**Síntomas:**
```
fatal error: runtime: out of memory
go: compile: internal compiler error
```

**Solución:**

```bash
# Aumentar espacio de intercambio en WSL
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verificar swap
free -h

# Alternativa: Compilar en 2 fases
cd ~/precompile-evm

# Fase 1: Pre-descargar módulos
go mod download

# Fase 2: Compilar con límite de goroutines
GOMAXPROCS=2 go build -v ./...

# Fase 3: Build final con optimización
CGO_ENABLED=1 GOPROXY=https://goproxy.cn go build -o bin/subnet-evm ./cmd/simulator
```

---

## VALIDACIÓN RÁPIDA POST-FIX

```bash
#!/bin/bash
# verify-wsl-rtgs.sh

echo "Verificando salud de WSL + L1 RTGS..."

# 1. IPv6
if [ "$(cat /proc/sys/net/ipv6/conf/all/disable_ipv6)" = "1" ]; then
    echo "✓ IPv6 deshabilitado"
else
    echo "✗ IPv6 HABILITADO - FIX requerido"
fi

# 2. DNS
if grep -q "nameserver 1.1.1.1" /etc/resolv.conf; then
    echo "✓ DNS correcto"
else
    echo "✗ DNS incorrecto"
fi

# 3. MTU
MTU=$(ip link show eth0 | grep -oP 'mtu \K[0-9]+')
if [ "$MTU" -le "1350" ]; then
    echo "✓ MTU correcto: $MTU"
else
    echo "✗ MTU alto: $MTU"
fi

# 4. Avalanchego
if pgrep -f avalanchego > /dev/null; then
    echo "✓ Avalanchego ejecutándose"
else
    echo "✗ Avalanchego no ejecutándose"
fi

# 5. RPC
if timeout 3 curl -s -X POST http://127.0.0.1:9654/ext/bc/rtgs-l1/rpc \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' \
  | grep -q "result"; then
    echo "✓ RPC responde"
else
    echo "✗ RPC no responde"
fi

echo "Verificación completada."
```

---

## REFERENCIAS DE LOGS

### Dónde revisar errores

```bash
# Logs principales (Avalanchego)
~/.avalanche-cli/local/rtgs-l1-local-node-local-network/NodeID-*/logs/main.log

# Logs de consenso P-Chain
~/.avalanche-cli/local/rtgs-l1-local-node-local-network/NodeID-*/logs/P.log

# Logs de blockchain específico
~/.avalanche-cli/local/rtgs-l1-local-node-local-network/NodeID-*/logs/X.log

# Patrones de búsqueda comunes
grep -i "error\|fatal\|panic" ~/.avalanche-cli/local/rtgs-l1*/NodeID-*/logs/*.log

# Error específico: vmFactory
grep -i "vmFactory\|was not found" ~/.avalanche-cli/local/rtgs-l1*/NodeID-*/logs/*.log

# Error específico: bootstrap
grep -i "bootstrap\|timeout\|deadline" ~/.avalanche-cli/local/rtgs-l1*/NodeID-*/logs/*.log

# Ver últimas líneas en vivo
tail -f ~/.avalanche-cli/local/rtgs-l1-local-node-local-network/NodeID-*/logs/main.log
```

---

## PROCEDIMIENTO DE LIMPIEZA COMPLETA

Si todo falla irreversiblemente:

```bash
#!/bin/bash

echo "⚠ LIMPIEZA COMPLETA DE L1 RTGS"
echo "Esto eliminará TODA la configuración y datos."
read -p "¿Continuar? (s/N)" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
fi

# Detener procesos
pkill -9 -f avalanchego || true

# Limpiar configuración local
rm -rf ~/.avalanche-cli/local/rtgs-l1*
rm -rf ~/.avalanche-cli/runs/network_*

# Limpiar plugins
rm -rf ~/.avalanchego/plugins/*

# Limpiar genesis
rm -f ~/Team1Latam-Hackathon/run/genesis-rtgs-l1.json

# Liberar puertos
sudo fuser -k 9650/tcp 9651/tcp 9652/tcp 9653/tcp 9654/tcp || true

# Esperar
sleep 5

echo "✓ Limpieza completada. Puedes reintentar deployment."
```

---

## CUÁNDO MIGRAR A DASHBOARD

Considera migrar a Fuji Testnet Dashboard si:

- [ ] Los WSL timeouts persisten después de 2 rondas de fixes
- [ ] El almacenamiento está agotado
- [ ] Necesitas múltiples nodos validadores (>2)
- [ ] Requieres persistencia de datos en producción
- [ ] Necesitas exponer RPC públicamente

**Dashboard URL:** https://testnet.avax.network/dashboard

