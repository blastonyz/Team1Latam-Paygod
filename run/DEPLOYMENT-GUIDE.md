# L1 RTGS PRIVADA - GUÍA DE DEPLOYMENT EN WSL
## Resumen Ejecutivo de Archivos y Próximos Pasos

**Estado:** Listos los archivos de configuración y scripts. Listo para deployment en WSL.

---

## 📁 ARCHIVOS GENERADOS - DESCRIPCIÓN Y USO

### 1. **RTGS-ARCHITECTURE.md** ✅
- **Ubicación:** `Team1Latam-Hackathon/run/RTGS-ARCHITECTURE.md`
- **Contenido:** Especificación técnica completa (Parte 1)
- **Uso:** Referencia arquitectónica para entender diseño PoA, ISO 20022, privacidad, Teleporter
- **Líneas:** ~2,500

### 2. **genesis-rtgs-l1.json** ✅
- **Ubicación:** `Team1Latam-Hackathon/run/genesis-rtgs-l1.json`
- **Contenido:** Configuración de blockchain (chain ID 77777)
- **Características:**
  - Chain ID: 77777 (RTGS)
  - Gas Limit: 8M (4x Ethereum)
  - Block Time: 2 segundos (garantizado)
  - Pre-minado: 2M tokens (1M Bankaool, 1M Arkángeles)
  - Precompilados: ContractDeployerAllowList, TxAllowList, Warp (Teleporter)
- **Parámetros:** PoA con 2 validadores, quorum 67% (ambos)
- **Uso:** El CLI lo consume automáticamente durante `blockchain create`

### 3. **deploy-rtgs-l1.sh** ✅ ← EJECUTAR PRIMERO
- **Ubicación:** `Team1Latam-Hackathon/run/deploy-rtgs-l1.sh`
- **Contenido:** Script de deployment automatizado con 7 fases
- **Fases:**
  1. **Pre-verificaciones** (WSL health, DNS, IPv6, MTU)
  2. **Limpieza** (detener avalanchego, liberar puertos)
  3. **Iniciar red local** (con timeouts para WSL)
  4. **Crear blockchain** (avalanche blockchain create)
  5. **Resolver VMID y binario** (copiar plugin al path correcto)
  6. **Desplegar** (avalanche blockchain deploy)
  7. **Validar conectividad** (tests RPC)
- **Tiempo esperado:** 5-10 minutos (en WSL puede ser 15-20m)
- **Ejecución:**
  ```bash
  cd ~/Team1Latam-Hackathon/run
  bash deploy-rtgs-l1.sh
  ```
- **Resultado esperado:**
  - Blockchain ID: [generado]
  - VM ID: [generado]
  - RPC URL: `http://127.0.0.1:9654/ext/bc/[BLOCKCHAIN_ID]/rpc`
  - Estado: ✓ Blockchain deployed

### 4. **validate-rtgs-l1.sh** ✅ ← EJECUTAR DESPUÉS DEL DEPLOYMENT
- **Ubicación:** `Team1Latam-Hackathon/run/validate-rtgs-l1.sh`
- **Contenido:** Suite de 10 tests de validación post-deployment
- **Tests:**
  1. Conectividad RPC
  2. Chain ID correcto (77777)
  3. Block number
  4. Gas price
  5. Peer count (validadores conectados)
  6. Network version
  7. Cuentas pre-minadas
  8. Transacción de prueba (manual)
  9. Logs de red (sin errores)
  10. Precompilados configurados
- **Ejecución:**
  ```bash
  cd ~/Team1Latam-Hackathon/run
  bash validate-rtgs-l1.sh
  ```
- **Salida esperada:**
  ```
  Tests pasados: 9/10
  ✓ TODOS LOS TESTS PASARON - L1 RTGS OPERATIVA
  ```

### 5. **GENESIS-CONFIG-GUIDE.md** ✅
- **Ubicación:** `Team1Latam-Hackathon/run/GENESIS-CONFIG-GUIDE.md`
- **Contenido:** Explicación línea por línea del genesis.json
- **Secciones:**
  - `config`: Chain forks, EVM compatibility
  - `subnet-evm`: Gas config, precompilados
  - `alloc`: Cuentas pre-minadas
  - Roles y permisos (ContractDeployerAllowList, TxAllowList)
  - Configuración de producción vs. desarrollo
  - Preguntas frecuentes
- **Uso:** Para customizar genesis si necesitas cambios (ej. más validadores, diferentes roles)

### 6. **WSL-TROUBLESHOOTING.md** ✅
- **Ubicación:** `Team1Latam-Hackathon/run/WSL-TROUBLESHOOTING.md`
- **Contenido:** Guía completa de troubleshooting para WSL
- **Secciones:**
  - Pre-verificaciones WSL (IPv6, DNS, MTU)
  - 8 problemas comunes + soluciones
  - Validación rápida post-fix
  - Limpieza completa
  - Patrones de búsqueda en logs
  - Cuándo migrar a dashboard
- **Uso:** Consultarlo si tienes errores durante deployment

---

## 🚀 FLUJO DE DEPLOYMENT PASO A PASO

### PASO 1: Preparación WSL (5 min)
```bash
# Abrir terminal en WSL (en VS Code: Terminal → New Terminal)
# O: Windows PowerShell → wsl

# Ejecutar verificaciones previas
cat /proc/sys/net/ipv6/conf/all/disable_ipv6
# Esperado: 1 (si no, ver WSL-TROUBLESHOOTING.md sección "PREREQUISITOS")

cat /etc/resolv.conf
# Esperado: nameserver 1.1.1.1, nameserver 8.8.8.8
```

### PASO 2: Ejecutar Script de Deployment (10-20 min)
```bash
cd ~/Team1Latam-Hackathon/run
bash deploy-rtgs-l1.sh
```

**Durante la ejecución, verás:**
```
═══════════════════════════════════════════════════════════════
  L1 RTGS PRIVADA - AVALANCHE CLI DEPLOYMENT (WSL OPTIMIZED)
═══════════════════════════════════════════════════════════════

[FASE 0] PRE-VERIFICACIONES DE ENTORNO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ WSL detectado
✓ Avalanche CLI: avalanche version ...
✓ Binario precompile-evm disponible (60MB)
✓ IPv6 deshabilitado (correcto para WSL)
✓ MTU correcto: 1350

[FASE 1] LIMPIAR ESTADO DE DEPLOYMENTS ANTERIORES
...
[FASE 2] INICIAR RED LOCAL DE AVALANCHE
...
[FASE 3] CREAR BLOCKCHAIN L1 RTGS
...
[FASE 4] RESOLVER VMID Y CONFIGURAR BINARIO
...
[FASE 5] DESPLEGAR BLOCKCHAIN EN RED LOCAL
...
[FASE 6] OBTENER DETALLES DEL BLOCKCHAIN
...
[FASE 7] VALIDAR CONECTIVIDAD RPC
...

═══════════════════════════════════════════════════════════════
✓ DEPLOYMENT COMPLETADO EXITOSAMENTE
═══════════════════════════════════════════════════════════════

Información guardada en: ~/Team1Latam-Hackathon/run/RTGS-L1-DEPLOYMENT-INFO.txt
```

**Si hay errores**, consultar WSL-TROUBLESHOOTING.md con el mensaje de error específico.

### PASO 3: Validar Deployment (5 min)
```bash
cd ~/Team1Latam-Hackathon/run
bash validate-rtgs-l1.sh
```

**Salida esperada:**
```
═══════════════════════════════════════════════════════════════
  L1 RTGS PRIVADA - SUITE DE VALIDACIÓN POST-DEPLOYMENT
═══════════════════════════════════════════════════════════════

[TEST 1] Conectividad RPC
✓ RPC responde - Client: Subnet-EVM/v0.8.0

[TEST 2] Verificar Chain ID
✓ Chain ID correcto: 0x12fd9 (77777)

[TEST 3] Verificar Block Number
✓ Block Number: 5 (Hex: 0x5)

[TEST 4] Verificar Gas Price
✓ Gas Price: 1 Gwei (0x3b9aca00)
  ✓ Gas price bajo (ideal para RTGS)

[TEST 5] Verificar Peer Count
✓ Peer Count: 2
  ✓ Red sincronizada (al menos 1 peer)

...

═══════════════════════════════════════════════════════════════
  RESUMEN DE VALIDACIÓN
═══════════════════════════════════════════════════════════════

  Tests pasados:  9/10
  Tests fallidos: 0/10

✓ TODOS LOS TESTS PASARON - L1 RTGS OPERATIVA
```

### PASO 4: Verificar RPC Manualmente (opcional)
```bash
# Obtener RPC URL del archivo de info
RPC_URL=$(grep "RPC Endpoint:" ~/Team1Latam-Hackathon/run/RTGS-L1-DEPLOYMENT-INFO.txt | awk '{print $NF}')

# Test básico: Block number
curl -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'

# Respuesta esperada:
# {"jsonrpc":"2.0","result":"0x5","id":1}

# Test 2: Gas price
curl -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_gasPrice","params":[]}'

# Respuesta esperada:
# {"jsonrpc":"2.0","result":"0x3b9aca00","id":1}
```

---

## 📊 TOPOLOGÍA RESULTANTE

Después del deployment exitoso:

```
┌─────────────────────────────────────────┐
│        AVALANCHE LOCAL NETWORK          │
│          (2 Nodos - PoA)                │
├─────────────────────────────────────────┤
│                                         │
│  Nodo 1: NodeID-Bankaool                │
│  ├─ P-Chain Port: 9650                  │
│  ├─ C-Chain Port: 9651                  │
│  ├─ HTTP Port: 9659                     │
│  └─ Plugins: precompile-evm (VMID)      │
│                                         │
│  Nodo 2: NodeID-Arkángeles              │
│  ├─ P-Chain Port: 9652                  │
│  ├─ C-Chain Port: 9653                  │
│  ├─ HTTP Port: 9660                     │
│  └─ Plugins: precompile-evm (VMID)      │
│                                         │
├─────────────────────────────────────────┤
│     L1 RTGS (Custom Blockchain)         │
│                                         │
│  Chain ID: 77777                        │
│  VM ID: [generado por CLI]              │
│  Block Time: 2 segundos                 │
│  Gas Limit: 8M                          │
│  Finality: Instantánea                  │
│                                         │
│  RPC Endpoint:                          │
│  http://127.0.0.1:9654/ext/bc/         │
│           [BLOCKCHAIN_ID]/rpc           │
│                                         │
│  Pre-minado:                            │
│  - 0x8db97C7c... (Bankaool): 1M LIQ    │
│  - 0x0Fa8EA53... (Arkángeles): 1M LIQ  │
│                                         │
│  Precompilados:                         │
│  - ContractDeployerAllowList (0x0200...) │
│  - TxAllowList (0x0200...01)            │
│  - Warp/Teleporter (0x0200...05)       │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Después del deployment, verifica:

- [ ] **WSL Health**
  - [ ] IPv6 deshabilitado
  - [ ] DNS configurado (1.1.1.1, 8.8.8.8)
  - [ ] MTU en 1350

- [ ] **Avalanchego Running**
  - [ ] `ps aux | grep avalanchego` muestra 2 procesos
  - [ ] Puertos 9650-9654 en uso
  - [ ] Logs sin errores de `vmFactory`

- [ ] **Blockchain Creado**
  - [ ] `avalanche blockchain list` muestra `rtgs-l1`
  - [ ] `avalanche blockchain describe rtgs-l1` retorna validación
  - [ ] VMID no está vacío

- [ ] **RPC Funcional**
  - [ ] `eth_blockNumber` retorna número > 0
  - [ ] `eth_chainId` retorna `0x12fd9`
  - [ ] `eth_gasPrice` retorna `0x3b9aca00` (~1 Gwei)
  - [ ] `eth_getBalance` retorna saldos pre-minados

- [ ] **Validación Tests**
  - [ ] 9/10 tests de `validate-rtgs-l1.sh` pasan
  - [ ] No hay errors fatales en logs

---

## 📈 PRÓXIMOS PASOS DESPUÉS DEL DEPLOYMENT

1. **Desplegar Smart Contracts Fundacionales**
   - RTGSSettlementEngine (liquidación ISO 20022)
   - PrivateLiquidityToken (token privado)
   - KYBGateway (validación de beneficiarios)

2. **Configurar Validadores**
   - Agregar roles de validador
   - Configurar TxAllowList
   - Configurar ContractDeployerAllowList

3. **Integrar con Fuji Testnet**
   - Desplegar bridge contratos
   - Registrar L1 en Teleporter
   - Validar mensajes inter-cadena

4. **Testing End-to-End**
   - Liquidación RTGS (2 bancos)
   - Privacidad de balances (query bloqueada)
   - Interoperabilidad (L1 Privada ↔ Fuji)

---

## 🛠️ TROUBLESHOOTING RÁPIDO

| Síntoma | Solución Rápida |
|---------|-----------------|
| "context deadline exceeded" | Ver WSL-TROUBLESHOOTING.md, Problema 1 |
| "vmFactory was not found" | Script maneja automáticamente, pero ver Problema 2 |
| "Address already in use" | `pkill -9 -f avalanchego; sudo fuser -k 9650/tcp` |
| RPC no responde | Verificar que avalanchego está corriendo: `ps aux \| grep avalanchego` |
| Chain ID incorrecto | Revisar genesis-rtgs-l1.json, verificar `"chainId": 77777` |
| DNS timeout | Ejecutar verificaciones WSL de WSL-TROUBLESHOOTING.md |

---

## 📞 DECISIÓN: ¿Continuar en WSL o Migrar a Dashboard?

**Continúa en WSL si:**
- ✅ Deployment fue exitoso sin errores críticos
- ✅ Tests de validación pasan (9/10+)
- ✅ RPC funciona correctamente
- ✅ Necesitas control granular de configuración

**Migra a Dashboard si:**
- ❌ WSL timeout persisten después de múltiples intentos
- ❌ Memoria/almacenamiento insuficiente
- ❌ Necesitas múltiples validadores (>2)
- ❌ Requieres persistencia de datos a largo plazo

---

## 📖 ÍNDICE DE REFERENCIA RÁPIDA

| Necesito... | Ver Archivo |
|------------|------------|
| Entender arquitectura completa | RTGS-ARCHITECTURE.md |
| Explicar genesis JSON | GENESIS-CONFIG-GUIDE.md |
| Desplegar L1 | deploy-rtgs-l1.sh |
| Validar deployment | validate-rtgs-l1.sh |
| Troubleshooting errores | WSL-TROUBLESHOOTING.md |
| Detalles de RPC/endpoints | RTGS-L1-DEPLOYMENT-INFO.txt (generado) |

---

**Estado Actual:** ✅ Listo para ejecutar `bash deploy-rtgs-l1.sh`

**Siguiente comando:**
```bash
cd ~/Team1Latam-Hackathon/run && bash deploy-rtgs-l1.sh
```

