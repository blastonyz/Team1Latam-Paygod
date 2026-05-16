# CONFIGURACIÓN AVANZADA: L1 RTGS - PRECOMPILADOS Y PARÁMETROS EXACTOS

## 1. GENESIS JSON - EXPLICACIÓN LÍNEA POR LÍNEA

### Sección `config`

```json
{
  "config": {
    "chainId": 77777,                    // ID único de la cadena RTGS
    "homesteadBlock": 0,                 // Todos los forks activos desde bloque 0
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "arrowGlacierBlock": 0,
    "grayGlacierBlock": 0,
    "shanghaiBlock": 0,                  // Shanghai = PUSH0 opcode (útil)
    "cancunBlock": 0,                    // Cancun = MCOPY + Blobs (máxima compatibilidad)
```

**¿Por qué todos los forks en block 0?**
- Asegura que la L1 RTGS tiene la máxima compatibilidad EVM
- Permite usar contratos compilados para cualquier versión de Solidity
- Shanghai/Cancun son necesarios para Teleporter

---

### Sección `subnet-evm`

```json
    "subnet-evm": {
      "feeConfig": {
        "gasLimit": 8000000,              // Límite de gas por bloque
                                          // (4x mayor que Ethereum)
        "targetBlockRate": 2,             // Target: 1 bloque cada 2 segundos
        "minBaseFee": 1000000000,         // Min fee: 1 Gwei (10^9)
                                          // = 0.00000001 USD por gas (teórico)
        "targetGas": 15000000,            // Uso de gas target (50% de gasLimit)
        "baseFeeChangeDenominator": 36,   // EIP-1559: cambio máximo por bloque
                                          // = 1/36 = 2.78%
        "minBlockGasCost": 0,             // No hay costo mínimo
        "maxBlockGasCost": 1000000,       // Costo máximo de bloque
        "blockGasCostStep": 200000        // Incremento por bloque
      },
```

**¿Qué significa esto para RTGS?**
- Un bloque por 2 segundos es GARANTIZADO (no variable como Ethereum)
- Gas muy barato para bancos (minBaseFee bajo)
- Finality inmediata = no hay reorganizaciones

---

### Precompilados del Sistema

```json
      "contractDeployerAllowListConfig": {
        "blockTimestamp": 0,
        "allowListRoles": {
          "0x0000000000000000000000000000000000000000": 2
        }
      },
```

**ContractDeployerAllowList:**
- `blockTimestamp: 0` = Activo desde el inicio
- `0x0000000000000000000000000000000000000000` = Dirección comodín
- Valor `2` = Rol "Habilitado" (puede desplegar contratos)

**⚠️ IMPORTANTE PARA PRODUCCIÓN:**
Esto significa que CUALQUIERA puede desplegar contratos. Para producción, cambiar a:
```json
"allowListRoles": {
  "0xMultisigBankaool": 2,
  "0xMultisigArkangeles": 2
}
```

---

### TxAllowList

```json
      "txAllowListConfig": {
        "blockTimestamp": 0,
        "allowListRoles": {
          "0x0000000000000000000000000000000000000000": 0
        }
      },
```

**TxAllowList:**
- `blockTimestamp: 0` = Activo desde el inicio
- Valor `0` = Rol "Admin" (puede modificar la lista)
- Valor `1` = Rol "Habilitado" (puede enviar transacciones)

**Implicación:** Cualquiera puede enviar transacciones (necesario para que RTGSSettlementEngine funcione).

Para restricción máxima (solo validadores):
```json
"allowListRoles": {
  "0x8db97C7cECe249c2b98bDC0226Cc4C2A57BF52FC": 1,  // Bankaool validator
  "0x0Fa8EA536Be85F32724D57A37fb6A273B53528D3": 1   // Arkángeles validator
}
```

---

### Warp (Teleporter)

```json
      "warpConfig": {
        "blockTimestamp": 0,
        "quorumPercentage": 67
      }
    }
```

**Warp Config:**
- `blockTimestamp: 0` = Teleporter activo desde inicio
- `quorumPercentage: 67` = 67% de validadores deben firmar mensajes
- Con 2 validadores: (67% de 2 = 1.34 → redondeado a 2) = AMBOS deben firmar

---

## 2. ACCOUNT ALLOCATION (Pre-mineo)

```json
  "alloc": {
    "0x8db97C7cECe249c2b98bDC0226Cc4C2A57BF52FC": {
      "balance": "0xd3c21bcecceda1000000",  // = 1,000,000 * 10^18 unidades
      "code": "0x",                          // No es un contrato
      "nonce": "0x0",                        // Primera transacción
      "storage": {}                          // Sin storage
    },
    "0x0Fa8EA536Be85F32724D57A37fb6A273B53528D3": {
      "balance": "0xd3c21bcecceda1000000",  // = 1,000,000 * 10^18 unidades
      "code": "0x",
      "nonce": "0x0",
      "storage": {}
    }
  }
```

**Cuentas Pre-minadas:**
- Dirección 1 (Bankaool): 1M tokens
- Dirección 2 (Arkángeles): 1M tokens
- **Total en circulación inicial: 2M LIQ tokens**

---

## 3. CONFIGURACIÓN ALTERNATIVA: PRODUCCIÓN (RESTRINGIDA)

Para una implementación real con máxima privacidad/control:

```json
{
  "config": {
    "chainId": 77777,
    "subnet-evm": {
      "feeConfig": {
        "gasLimit": 8000000,
        "targetBlockRate": 2,
        "minBaseFee": 1000000000,          // Bancos pagan 1 Gwei/gas
        "targetGas": 15000000,
        "baseFeeChangeDenominator": 36,
        "minBlockGasCost": 0,
        "maxBlockGasCost": 1000000,
        "blockGasCostStep": 200000
      },
      "contractDeployerAllowListConfig": {
        "blockTimestamp": 0,
        "allowListRoles": {
          "0x8db97C7cECe249c2b98bDC0226Cc4C2A57BF52FC": 2,  // Solo Bankaool puede desplegar
          "0x0Fa8EA536Be85F32724D57A37fb6A273B53528D3": 2   // Solo Arkángeles puede desplegar
        }
      },
      "txAllowListConfig": {
        "blockTimestamp": 0,
        "allowListRoles": {
          "0x8db97C7cECe249c2b98bDC0226Cc4C2A57BF52FC": 1,  // Bankaool puede enviar tx
          "0x0Fa8EA536Be85F32724D57A37fb6A273B53528D3": 1   // Arkángeles puede enviar tx
        }
      },
      "warpConfig": {
        "blockTimestamp": 0,
        "quorumPercentage": 100             // AMBOS validadores deben firmar
      }
    }
  },
  "alloc": {
    "0x8db97C7cECe249c2b98bDC0226Cc4C2A57BF52FC": {
      "balance": "0x56bc75e2d630eb20000"   // = 5M LIQ para Bankaool
    },
    "0x0Fa8EA536Be85F32724D57A37fb6A273B53528D3": {
      "balance": "0x56bc75e2d630eb20000"   // = 5M LIQ para Arkángeles
    },
    "0xMultisigGovernanza": {
      "balance": "0xde0b6b3a7640000"       // = 1M LIQ para tesorería
    }
  }
}
```

---

## 4. EXPLICACIÓN DE ROLES Y PERMISOS

### ContractDeployerAllowList

| Dirección | Rol | Puede Desplegar | Puede Modificar Lista |
|-----------|-----|-----------------|----------------------|
| `0x000...` (comodín) | 2 (Enabled) | ✅ SÍ | ❌ No |
| Admin | 0 (Admin) | ✅ SÍ | ✅ SÍ |

### TxAllowList

| Dirección | Rol | Puede Enviar Tx | Puede Modificar Lista |
|-----------|-----|-----------------|----------------------|
| `0x000...` (comodín) | 0 (Admin) | N/A | ✅ SÍ |
| Habilitado | 1 (Enabled) | ✅ SÍ | ❌ No |

---

## 5. PREGUNTAS FRECUENTES

### ¿Qué pasa si alguien intenta enviar una transacción no autorizada en TxAllowList?

La transacción será **rechazada a nivel de node**, antes de entrar al mempool.

```
Error: "sender not allowed"
```

### ¿Puedo cambiar los precompilados después del launch?

**SÍ**, pero requiere:
1. Obtener una propuesta de cambio
2. Ambos validadores firman la propuesta
3. Ejecutar una transacción especial que modifique los parámetros

**NO es retroactivo**: Los cambios aplican desde el bloque en que se ejecuten.

### ¿Cuál es la diferencia entre `minBaseFee` y `maxBlockGasCost`?

- **minBaseFee**: Precio mínimo de gas que cobra la red
- **maxBlockGasCost**: Penalización criptográfica si un bloque cuesta "demasiado" en gas

### ¿Puedo tener más de 2 validadores?

**SÍ**, pero necesitas:
1. Agregar nuevos NodeIDs al genesis
2. Ambos validadores actuales deben acuerdo (multisig)
3. Requiere upgrade de la cadena

---

## 6. MIGRACIÓN DE CONFIGURACIÓN (Desarrollo → Producción)

```bash
# Fase 1: Development (actual)
# - ContractDeployerAllowList: ABIERTO (cualquiera)
# - TxAllowList: ABIERTO (cualquiera)
# - Propósito: Testing, validación de arquitectura

# Fase 2: Staging (antes de producción)
# - ContractDeployerAllowList: Solo Bankaool + Arkángeles
# - TxAllowList: Solo Bankaool + Arkángeles
# - Propósito: Auditoría, cumplimiento regulatorio

# Fase 3: Producción
# - ContractDeployerAllowList: Solo multisig de gobernanza
# - TxAllowList: Solo direcciones validadas (KYB)
# - Warp quorum: 100% (ambos validadores)
# - Propósito: Operación en vivo
```

---

## 7. VALIDACIÓN POST-DEPLOYMENT

```bash
#!/bin/bash

# Verificar que precompilados están activos
curl -X POST http://127.0.0.1:9654/ext/bc/[BLOCKCHAIN_ID]/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_call",
    "params": [{
      "to": "0x0200000000000000000000000000000000000000",  // ContractDeployerAllowList
      "data": "0x..." // ABI call
    }, "latest"]
  }'

# Resultado esperado: Función retorna los roles configurados
```

---

## PRÓXIMAS CONFIGURACIONES

Una vez que el deployment básico es validado:

1. **Desplegar RTGSSettlementEngine**
   - Compilar con: `solc --optimize RTGSSettlementEngine.sol`
   - Desplegar en: 0x0200000000000000000000000000000001000000

2. **Desplegar PrivateLiquidityToken**
   - Mint inicial: 2M tokens (1M Bankaool, 1M Arkángeles)
   - Owner: Multisig de gobernanza

3. **Configurar Teleporter**
   - Registrar L1 Privada en Fuji
   - Configurar bridges bidireccionales
   - Validar mensajes inter-cadena

4. **Testing End-to-End**
   - Liquidación RTGS
   - Privacy de balances
   - Interoperabilidad con Fuji
