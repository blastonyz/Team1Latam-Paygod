# ARQUITECTURA DE L1 RTGS PRIVADA - BANKAOOL + ARKÁNGELES
## Sistema de Liquidación Interbancaria Soberana en Avalanche Evergreen Subnets

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Clasificación:** Especificación Técnica Institucional (B2B)  
**Audiencia:** Arquitectos de Infraestructura, DevOps Blockchain, Validadores del Consorcio

---

## ÍNDICE EJECUTIVO

Este documento especifica el diseño de una **Subnet privada de Avalanche (L1 Evergreen)** operada como sistema RTGS (Real-Time Gross Settlement) exclusivo para liquidaciones interbancarias entre instituciones financieras bajo el modelo de Proof of Authority (PoA) con dos validadores designados:
- **Bankaool** (Validador 1)
- **Arkángeles** (Validador 2)

La red implementa:
- ✅ **Liquidación de sub-2 segundos** sin intermediarios DeFi
- ✅ **Cumplimiento ISO 20022** (mensajes pacs.009 firmados EIP-712)
- ✅ **Privacidad criptográfica** de saldos (ERC-20 personalizado con restricciones)
- ✅ **Interoperabilidad nativa** con ecosistema público (Fuji/Mainnet) vía Avalanche Teleporter (AWM)
- ✅ **Gobernanza por consorcio** sin componentes DeFi abiertas

---

## PARTE 1: ESPECIFICACIÓN ARQUITECTÓNICA

---

## 1. OBJETIVO DEL SISTEMA: RTGS SOBERANO

### 1.1 Definición Funcional

Un **RTGS (Real-Time Gross Settlement)** es un sistema de liquidación de fondos interbancarios donde:
- Cada transacción se procesa **de forma individual e inmediata**
- Los fondos se transfieren entre cuentas de reserva de los bancos **de forma irrevocable**
- No hay netting (compensación) por saldo neto

**En el contexto de blockchain privada con Avalanche:**

```
┌─────────────────────────────────────────────────────┐
│         RTGS L1 PRIVADA (Avalanche Subnet)          │
│                                                     │
│  Validadores: Bankaool, Arkángeles                 │
│  Consenso: PoA (Proof of Authority)                │
│  Tiempo de Bloque: 2 segundos                       │
│  Finality: Instantáneo (1 bloque = finality)       │
│                                                     │
│  ┌────────────────┐         ┌────────────────┐    │
│  │ Bankaool Bank  │◄─────►  │ Arkángeles Inc │    │
│  │ Validator 1    │         │ Validator 2    │    │
│  │ NodeID-xxxxxx  │         │ NodeID-yyyyyy  │    │
│  └────────────────┘         └────────────────┘    │
│          ▲                           ▲             │
│          │ pacs.009 (EIP-712 sig)   │             │
│          └───────────┬──────────────┘             │
│                      │                             │
│         ┌────────────▼──────────────┐             │
│         │RTGSSettlementEngine       │             │
│         │ - Atomicidad garantizada  │             │
│         │ - Sub-2s liquidación      │             │
│         │ - 1 tx = 1 liquidación    │             │
│         └───────────────────────────┘             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.2 Modelo de Consenso: Proof of Authority (PoA)

**Características:**
- **Validadores:** 2 nodos (Bankaool, Arkángeles)
- **Requisito de Firmas:** Ambos validadores deben firmar **cada bloque**
- **Throughput:** ~1,000 transacciones/segundo (limitada por capacidad de las instituciones, no por red)
- **Finalidad:** Instantánea (un bloque = finality irreversible)

**Tabla Comparativa - Consenso:**

| Parámetro | PoW Público | PoS Público | PoA Privada (RTGS) |
|-----------|------------|-----------|-----------------|
| Validadores | Descentralizado | 1,000+ | **2 (Permisionado)** |
| Consenso | Prueba de trabajo | Delegación de stake | Firmas multiples |
| Tiempo bloque | 15s+ | 2-3s | **2s (garantizado)** |
| Finalidad | Probabilística | Económica | **Criptográfica inmediata** |
| Censura | Imposible | Muy difícil | Requerida (KYB Gateway) |
| Sybil Attack | Mitigado por PoW | Mitigado por stake | **N/A (permisionado)** |

### 1.3 Parámetros de Configuración de Red (PoA)

```yaml
# Genesis Configuration - PoA Parameters
consensus:
  proof_of_authority:
    validators:
      - node_id: "NodeID-Bankaool1234567890" 
        address: "0xBankaoolValidatorAddress"
        weight: 1  # Peso igual para ambos validadores
        
      - node_id: "NodeID-Arkangeles987654321"
        address: "0xArkangeles ValidatorAddress"
        weight: 1

block_parameters:
  target_block_time_ms: 2000           # 2 segundos
  max_transactions_per_block: 500      # Adaptable a demanda
  uncle_penalty: 0                     # No uncles en PoA
  
network_parameters:
  finality_requirement: 1               # 1 bloque = finality
  consensus_participation_rate: 100     # Ambos deben participar
  slashing_multiplier: 0.01             # Penalización para validadores ausentes
```

### 1.4 Ciclo de Liquidación Atómica

```
CICLO DE LIQUIDACIÓN EN TIEMPO REAL
════════════════════════════════════════

[T+0ms]  Banco Emisor (ej. Bankaool): Emite transacción de liquidación
         └─ Dirección: 0xBankaool_Treasury
         └─ Monto: 1,000,000 USD
         └─ Receptor: 0xArkangeles_Treasury
         └─ Firmada: EIP-712 (off-chain, basada en pacs.009)

[T+500ms] Red RTGS recibe transacción
         └─ Validador 1 (Bankaool) valida sintaxis + saldo disponible
         └─ Validador 2 (Arkángeles) valida sintaxis + saldo disponible
         └─ Ambos acuerdan incluir en próximo bloque

[T+2000ms] BLOQUE CONFIRMADO
         └─ Ambos validadores firman: "Bloque #12345, txHash: 0xabcd..."
         └─ RTGS Settlement Engine ejecuta la liquidación
         └─ Balances actualizados:
            - Bankaool: -1,000,000 USD (de-reserva de fondos)
            - Arkángeles: +1,000,000 USD (acreditado al receptáculo)

[T+2100ms] FINALITY INMEDIATA
         └─ Transacción es IRREVOCABLE
         └─ No hay posibilidad de rollback
         └─ Confirmación enviada a ambas instituciones
         └─ Mensaje de acuse de recibo (pacs.028)

TIEMPO TOTAL: 2.1 segundos (Sub-2s garantizado)
```

---

## 2. ESTRUCTURA TRANSACCIONAL ISO 20022 CON LIQUIDACIÓN ATÓMICA

### 2.1 Mapeo ISO 20022 → Blockchain

El estándar ISO 20022 define mensajes XML estructurados para pagos internacionales. Nuestra implementación integra estos mensajes directamente en transacciones blockchain:

```
ISO 20022 Message (pacs.009)
    │
    ├─ Originador: Bankaool Bank
    │  └─ BIC: BANKAOOLXXXX
    │  └─ IBAN: BR5700000000000000000000
    │
    ├─ Beneficiario: Arkángeles Inc
    │  └─ BIC: ARKAGELESXX
    │  └─ IBAN: AR2300000000000000000000
    │
    ├─ Importe: 1,000,000 USD
    │
    ├─ Referencia: RTGS-2026-05-14-001
    │
    └─ Timestamp: 2026-05-14T14:30:00Z
         │
         └─► [HASH CRIPTOGRÁFICO]
             └─► EIP-712 Signature (Private Key del Banco)
                 │
                 └─► [TRANSACCIÓN BLOCKCHAIN ATÓMICA]
```

### 2.2 El Motor de Liquidación Atómica (RTGSSettlementEngine)

#### 2.2.1 Estructura del Contrato

```solidity
// PSEUDO-CÓDIGO - RTGSSettlementEngine.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title RTGSSettlementEngine
 * @notice Motor de liquidación interbancaria que procesa mensajes pacs.009
 *         de forma atómica y con validación ISO 20022
 */
contract RTGSSettlementEngine is Ownable {
    
    // ============ TOKEN PRIVADO DE LIQUIDACIÓN ============
    IERC20Permit public liquidityToken;  // Token ERC-20 personalizado
    
    // ============ REGISTRO DE TRANSACCIONES ISO 20022 ============
    struct ISO20022Settlement {
        bytes32 pacs009Hash;              // Hash del mensaje pacs.009 original
        address originator;               // Banco emisor (ej. Bankaool)
        address beneficiary;              // Banco receptor (ej. Arkángeles)
        uint256 amount;                   // Monto en unidades atómicas
        uint256 timestamp;                // Timestamp de liquidación
        bytes32 referenceId;              // Referencia ISO 20022 única
        bool isSettled;                   // Flag de liquidación completada
        bytes32 eip712Signature;          // Firma EIP-712 off-chain
    }
    
    // Mapeo: pacs009Hash → Detalles de liquidación
    mapping(bytes32 => ISO20022Settlement) public settlements;
    
    // ============ EVENTOS ============
    event LiquidationInitiated(
        bytes32 indexed pacs009Hash,
        address indexed originator,
        address indexed beneficiary,
        uint256 amount
    );
    
    event LiquidationExecuted(
        bytes32 indexed pacs009Hash,
        address indexed originator,
        address indexed beneficiary,
        uint256 amount,
        uint256 settledAt
    );
    
    event LiquidationFailed(
        bytes32 indexed pacs009Hash,
        string reason
    );
    
    // ============ FUNCIONES PRINCIPALES ============
    
    /**
     * @notice Procesa una liquidación ISO 20022 con EIP-2612 Permit
     * 
     * @param pacs009_xml_hash    Hash del mensaje pacs.009 (off-chain)
     * @param originator          Dirección del banco emisor
     * @param beneficiary         Dirección del banco receptor
     * @param amount              Monto en unidades atómicas (ej. 1e18 = 1 USD)
     * @param referenceId         Referencia ISO 20022 única
     * @param deadline            Deadline para validez de firma Permit
     * @param v, r, s             Parámetros de firma Permit (EIP-2612)
     * @param eip712_sig          Firma EIP-712 del originator que autoriza esta liquidación
     * 
     * @return settlementHash     Hash de liquidación registrado
     */
    function executePermitSettlement(
        bytes32 pacs009_xml_hash,
        address originator,
        address beneficiary,
        uint256 amount,
        bytes32 referenceId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes calldata eip712_sig
    ) external returns (bytes32) {
        
        // ━━━━━ FASE 1: VALIDACIONES ━━━━━
        require(originator != beneficiary, "Originator == Beneficiary");
        require(amount > 0, "Amount must be > 0");
        require(block.timestamp <= deadline, "Permit expired");
        
        // Validar que la firma EIP-712 proviene del originator
        bytes32 recoveredAddress = ecrecover(
            keccak256(abi.encodePacked(
                pacs009_xml_hash,
                originator,
                beneficiary,
                amount,
                referenceId,
                block.timestamp
            )),
            v, r, s
        );
        require(recoveredAddress == originator, "Invalid EIP-712 signature");
        
        // ━━━━━ FASE 2: APROBACIÓN CON PERMIT (EIP-2612) ━━━━━
        // El originator pre-aprueba fondos off-chain mediante Permit
        // Esto permite que el contrato transfiera fondos sin un tx previo de approve()
        liquidityToken.permit(
            originator,
            address(this),
            amount,
            deadline,
            v, r, s
        );
        
        // ━━━━━ FASE 3: LIQUIDACIÓN ATÓMICA ━━━━━
        // En una ÚNICA transacción, se ejecutan:
        // 1. Transferencia de fondos del originator al beneficiary
        // 2. Registro en blockchain de la liquidación
        // 3. Emisión de evento de confirmación
        
        bool success = liquidityToken.transferFrom(
            originator,
            beneficiary,
            amount
        );
        
        require(success, "Token transfer failed");
        
        // ━━━━━ FASE 4: REGISTRO EN BLOCKCHAIN ━━━━━
        ISO20022Settlement memory settlement = ISO20022Settlement({
            pacs009Hash: pacs009_xml_hash,
            originator: originator,
            beneficiary: beneficiary,
            amount: amount,
            timestamp: block.timestamp,
            referenceId: referenceId,
            isSettled: true,
            eip712Signature: keccak256(eip712_sig)
        });
        
        settlements[pacs009_xml_hash] = settlement;
        
        emit LiquidationExecuted(
            pacs009_xml_hash,
            originator,
            beneficiary,
            amount,
            block.timestamp
        );
        
        return pacs009_xml_hash;
    }
    
    /**
     * @notice Verifica que una liquidación fue registrada y es irreversible
     */
    function querySettlementStatus(bytes32 pacs009_xml_hash) 
        external 
        view 
        returns (ISO20022Settlement memory)
    {
        require(settlements[pacs009_xml_hash].isSettled, "Settlement not found");
        return settlements[pacs009_xml_hash];
    }
}
```

#### 2.2.2 Flujo de Ejecución Paso a Paso

```
┌─────────────────────────────────────────────────────────────────────┐
│ EJECUCIÓN DE LIQUIDACIÓN ATÓMICA ISO 20022 + EIP-2612 PERMIT       │
└─────────────────────────────────────────────────────────────────────┘

FASE OFFLINE (Off-Chain)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Banco Emisor (Bankaool) prepara mensaje ISO 20022:
   
   pacs009_message = {
       "Originador": "BANKAOOLXXXX",
       "Beneficiario": "ARKAGELESXX",
       "Importe": "1,000,000 USD",
       "Fecha": "2026-05-14",
       "Referencia": "RTGS-2026-05-14-001",
       "CodigoAutenticacion": "[digital signature]"
   }
   
   pacs009_xml_hash = SHA256(JSON(pacs009_message))
   
2. Bankaool firma dos componentes con su clave privada:

   a) Firma EIP-712 (para autenticación en blockchain):
      ┌──────────────────────────────────────────┐
      │ EIP712Domain {                           │
      │   name: "RTGSSettlementEngine",          │
      │   version: "1",                          │
      │   chainId: [RTGS_L1_CHAIN_ID],          │
      │   verifyingContract: 0xRTGSAddress       │
      │ }                                        │
      │                                          │
      │ message {                                │
      │   pacs009_xml_hash: 0x[hash],            │
      │   originator: 0xBankaool,                │
      │   beneficiary: 0xArkangeles,             │
      │   amount: 1000000e6,                     │
      │   referenceId: "RTGS-2026-05-14-001"     │
      │ }                                        │
      │                                          │
      │ Signature: [V, R, S] ← Clave privada    │
      └──────────────────────────────────────────┘
   
   b) Firma EIP-2612 Permit (para autorización de fondos):
      ┌──────────────────────────────────────────┐
      │ struct Permit {                          │
      │   owner: 0xBankaool,                     │
      │   spender: 0xRTGSEngine,                 │
      │   value: 1000000e6,                      │
      │   nonce: [nonce_actual],                 │
      │   deadline: [timestamp_futuro]           │
      │ }                                        │
      │                                          │
      │ Signature Permit: [V, R, S]              │
      └──────────────────────────────────────────┘

3. Bankaool envía mensaje a Arkángeles con:
   - pacs009_xml_hash (hash del mensaje)
   - eip712_signature (V, R, S de autenticación)
   - permit_signature (V, R, S de autorización)
   - [Todos los parámetros sin la clave privada]

FASE ONCHAIN (En Blockchain L1 RTGS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. Arkángeles (operador, no necesariamente banco), recibe solicitud
   y construye transacción blockchain:
   
   tx = {
       to: 0xRTGSSettlementEngine,
       function: executePermitSettlement(
           pacs009_xml_hash,
           originator = 0xBankaool,
           beneficiary = 0xArkangeles,
           amount = 1000000e6,
           referenceId = "RTGS-2026-05-14-001",
           deadline = [timestamp_futuro],
           v, r, s,  // ← Permit signature
           eip712_sig // ← EIP-712 signature
       )
   }

5. Transacción entra a mempool de la Red RTGS L1 (PoA)

6. VALIDADOR 1 (Bankaool) valida:
   ✓ Sintaxis de transacción correcta
   ✓ Saldo de Bankaool >= 1,000,000 USD
   ✓ Firma EIP-712 es válida (ecrecover retorna 0xBankaool)
   ✓ Firma Permit es válida
   ✓ Incluye en mempool local

7. VALIDADOR 2 (Arkángeles) valida:
   ✓ Sintaxis de transacción correcta
   ✓ Saldo de Bankaool >= 1,000,000 USD
   ✓ Firma EIP-712 es válida
   ✓ Firma Permit es válida
   ✓ Incluye en mempool local

8. Próximo bloque (T+2s):
   ┌──────────────────────────────────┐
   │ BLOQUE #12345                    │
   │ Timestamp: 2026-05-14 14:30:02Z │
   │ Productor: Bankaool              │
   │                                  │
   │ Transacciones:                   │
   │ - executePermitSettlement(...)   │
   │                                  │
   │ Merkle Root: 0x[hash_tx]         │
   │                                  │
   │ Firma Validador 1 (Bankaool)     │
   │ Firma Validador 2 (Arkángeles)   │
   │                                  │
   │ ✓ BLOQUE CONFIRMADO Y FINAL      │
   └──────────────────────────────────┘

9. RTGSSettlementEngine ejecuta transacción:
   
   PASO 1: ecrecover(eip712_sig) → 0xBankaool ✓
   PASO 2: permit(...) → Aprobación implicit de tokens
   PASO 3: transferFrom(0xBankaool, 0xArkangeles, 1e6)
   
   Balance Changes:
   - 0xBankaool: 5,000,000 - 1,000,000 = 4,000,000 USD
   - 0xArkangeles: 3,000,000 + 1,000,000 = 4,000,000 USD
   
   PASO 4: Registrar en mapping settlements[pacs009_xml_hash]
   PASO 5: emit LiquidationExecuted(...)

10. FINALITY INMEDIATA:
    - El bloque fue firmado por AMBOS validadores
    - No puede ser rollback (es PoA, no hay reorg)
    - Transacción es IRREVERSIBLE
    - Status: LIQUIDACIÓN COMPLETADA

CONFIRMACIÓN Y ACUSE DE RECIBO (pacs.028)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11. Sistema de la L1 RTGS emite acuse de recibo:
    
    pacs028_acuse = {
        "CodigoMensajeOriginal": "pacs.009",
        "ReferenceId": "RTGS-2026-05-14-001",
        "Estado": "COMPLETADO",
        "BlockHash": "0x[hash_bloque]",
        "TransactionHash": "0x[hash_tx]",
        "BlockNumber": 12345,
        "Timestamp": "2026-05-14T14:30:02Z"
    }

12. Ambos bancos reciben confirmación:
    Bankaool: "Fondos liquidados exitosamente"
    Arkángeles: "Fondos recibidos e irreversibles"

RESUMEN DE GARANTÍAS CRIPTOGRÁFICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ AUTENTICIDAD: Solo Bankaool puede firmar eip712_sig (clave privada)
✓ AUTORIZACIÓN: Solo Bankaool aprueba transferencia (Permit)
✓ ATOMICIDAD: La transacción ejecuta 2 operaciones en 1 tx:
              1. ecrecover + validación
              2. permit implícito + transferencia
              No hay estado intermedio
✓ FINALITY: Bloque firmado por PoA = Irrevocable en 2 segundos
✓ TRAZABILIDAD: Cada liquidación registrada en blockchain con:
                - Hash ISO 20022
                - Firmas criptográficas
                - Timestamp blockchain
                - Block hash
```

### 2.3 Ventajas de la Arquitectura ISO 20022 + EIP-2612

| Aspecto | Método Tradicional | Nuestro Enfoque |
|--------|------------------|----------------|
| **Aprobación de fondos** | tx.approve() → esperar → tx.transferFrom() | EIP-2612 Permit en firmamultisig offline |
| **Transacciones** | 2 tx (approve + transfer) | **1 tx (transferencia directa)** |
| **Costos de gas** | 2x gas (approve + transfer) | **50% menos gas** |
| **Pasos de validación** | 2 pasos secuenciales | **1 paso atómico** |
| **Riesgo de front-running** | Sí (entre approve y transfer) | **No** (Permit es off-chain) |
| **Cumplimiento ISO 20022** | Manual, fuera de blockchain | **Integrado en mensaje** |
| **Reversibilidad** | Posible con reorg | **Imposible (PoA)** |

---

## 3. PRIVACIDAD SELECTIVA DE BALANCES: ERC-20 PERSONALIZADO

### 3.1 El Problema: Transparencia Pública vs. Secreto Bancario

En una EVM pública estándar:

```solidity
// ❌ PROBLEMA: Token ERC-20 Estándar (Transparencia Total)
contract StandardERC20 is ERC20 {
    mapping(address => uint256) public balanceOf;  // ← PÚBLICO
}

// Cualquier atacante puede consultar:
uint256 saldoBankaool = token.balanceOf(0xBankaool);
uint256 saldoArkangeles = token.balanceOf(0xArkangeles);

// Resultado: Los saldos de todas las instituciones son visibles
// para competidores, atacantes, terceros no autorizados
```

**Implicaciones para Bancos:**
- 🚨 Exposición de estrategias de tesorería
- 🚨 Riesgo de ataque dirigido a bancos con saldos bajos
- 🚨 Violación de confidencialidad empresarial
- 🚨 Incumplimiento regulatorio (secreto bancario)

### 3.2 Solución: ERC-20 con Restricciones de Lectura (Access Control)

```solidity
// ✅ SOLUCIÓN: Token Privado con Visibilidad Controlada

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PrivateLiquidityToken
 * @notice Token ERC-20 personalizado para la Red RTGS Privada
 * 
 * Características:
 * - Balances PRIVADOS (no legibles públicamente)
 * - Lectura restrictiva: Solo el propietario, auditores autorizados, 
 *   o Smart Contracts DeFi explícitamente autorizados
 * - Transferencias funcionales pero sin visibilidad de saldos
 */
contract PrivateLiquidityToken is ERC20, AccessControl {
    
    // ============ ROLES DE CONTROL DE ACCESO ============
    
    /// Rol para Bancos (pueden leer sus propios saldos)
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");
    
    /// Rol para Auditores Designados (acceso de auditoría)
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    
    /// Rol para Smart Contracts DeFi Autorizados
    bytes32 public constant DEFI_ROUTER_ROLE = keccak256("DEFI_ROUTER_ROLE");
    
    /// Rol de Administrador (solo multifirma del consorcio)
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // ============ MAPEOS PRIVADOS ============
    
    /// Mapeo privado: address → saldo (no es public)
    mapping(address => uint256) private _secretBalances;
    
    /// Whitelist de direcciones que pueden consultar saldos
    mapping(address => mapping(address => bool)) private _balanceReadAccess;
    
    // ============ CONSTRUCTOR ============
    
    constructor(address consortiumMultisig) ERC20("Liquidity Token", "LIQ") {
        // El multisig del consorcio es el administrador inicial
        _setupRole(ADMIN_ROLE, consortiumMultisig);
        _setupRole(DEFAULT_ADMIN_ROLE, consortiumMultisig);
    }
    
    // ============ FUNCIÓN CRÍTICA: balanceOf CON RESTRICCIONES ============
    
    /**
     * @notice Override de balanceOf con control de acceso
     * @dev Solo retorna saldo si la dirección consultante está autorizada
     * 
     * Reglas de autorización:
     * 1. El propietario SIEMPRE puede ver su propio saldo
     * 2. Auditores pueden ver saldos de cualquiera
     * 3. Smart Contracts DeFi autorizados pueden ver saldos
     * 4. Otros consultantes reciben "0" (privacy)
     */
    function balanceOf(address account) 
        public 
        view 
        override(ERC20) 
        returns (uint256) 
    {
        // ━━━━ CASO 1: El propietario consulta su PROPIO saldo ━━━━
        if (msg.sender == account) {
            return _secretBalances[account];
        }
        
        // ━━━━ CASO 2: Auditor autorizado (rol AUDITOR_ROLE) ━━━━
        if (hasRole(AUDITOR_ROLE, msg.sender)) {
            return _secretBalances[account];
        }
        
        // ━━━━ CASO 3: Smart Contract DeFi explícitamente autorizado ━━━━
        if (hasRole(DEFI_ROUTER_ROLE, msg.sender)) {
            if (_balanceReadAccess[account][msg.sender]) {
                return _secretBalances[account];
            }
        }
        
        // ━━━━ CASO 4: Cualquier otro consultante (incluyendo atacantes) ━━━━
        // Retorna 0 en lugar de revertir (para no exponer que existe la función)
        return 0;
    }
    
    // ============ TRANSFERENCIAS INTERNAS (Sin Lectura Pública) ============
    
    /**
     * @notice Transferencia interna entre bancos
     * @dev Ejecuta la transferencia sin exponer balances públicamente
     * 
     * El contrato RTGSSettlementEngine usa este método de forma interna
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(_secretBalances[from] >= amount, "Insufficient private balance");
        
        // Actualizar saldos secretos
        _secretBalances[from] -= amount;
        _secretBalances[to] += amount;
        
        // Emitir evento (necesario para auditoría en blockchain)
        emit Transfer(from, to, amount);
    }
    
    /**
     * @notice Aprobación interna para autorizar transferencias
     * @dev No expone el allowance públicamente
     */
    function approve(address spender, uint256 amount) 
        public 
        override(ERC20) 
        returns (bool) 
    {
        // Lógica interna: no requerimos visibilidad de allowances
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    // ============ FUNCIONES DE AUDITORÍA Y GOBERNANZA ============
    
    /**
     * @notice Autorizar a un Smart Contract DeFi para acceder a saldos
     * @dev Solo el administrador del consorcio puede hacer esto
     * 
     * @param defiRouter Dirección del contrato DeFi
     * @param authorizedUser Dirección del usuario que autoriza
     */
    function authorizeDefiRouter(
        address defiRouter,
        address authorizedUser
    ) external onlyRole(ADMIN_ROLE) {
        require(hasRole(DEFI_ROUTER_ROLE, defiRouter), "Not a DeFi Router");
        _balanceReadAccess[authorizedUser][defiRouter] = true;
        
        emit DefiRouterAuthorized(defiRouter, authorizedUser);
    }
    
    /**
     * @notice Revocar autorización de DeFi Router
     */
    function revokeDefiRouter(
        address defiRouter,
        address authorizedUser
    ) external onlyRole(ADMIN_ROLE) {
        _balanceReadAccess[authorizedUser][defiRouter] = false;
        
        emit DefiRouterRevoked(defiRouter, authorizedUser);
    }
    
    /**
     * @notice Agregar auditor con acceso de lectura completa
     * @dev Solo el administrador puede hacer esto
     */
    function grantAuditorRole(address auditor) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        grantRole(AUDITOR_ROLE, auditor);
        emit AuditorAdded(auditor);
    }
    
    // ============ EVENTOS ============
    
    event DefiRouterAuthorized(address indexed defiRouter, address indexed user);
    event DefiRouterRevoked(address indexed defiRouter, address indexed user);
    event AuditorAdded(address indexed auditor);
    
    // ============ MINTEO Y QUEMA (Solo Administración) ============
    
    /**
     * @notice Mintear nuevos tokens (solo administrador)
     * @dev Usado para pre-minear fondos iniciales a tesorerías de bancos
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _secretBalances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    /**
     * @notice Quemar tokens (solo administrador)
     * @dev Retira fondos de circulación
     */
    function burn(address from, uint256 amount) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_secretBalances[from] >= amount, "Insufficient balance");
        _secretBalances[from] -= amount;
        emit Transfer(from, address(0), amount);
    }
}
```

### 3.3 Matriz de Control de Acceso

```
┌──────────────────────┬────────────────┬────────────────┬──────────────┐
│ Consultante          │ Ver su propio   │ Ver otro banco │ Ver auditor  │
│                      │ saldo          │ saldo          │ saldo        │
├──────────────────────┼────────────────┼────────────────┼──────────────┤
│ Banco (ej. Bankaool) │      ✓         │      ✗ (0)     │      ✗ (0)   │
│ Arkángeles (otro)    │      ✓         │      ✗ (0)     │      ✗ (0)   │
│ Auditor Regulatorio  │      ✓         │      ✓         │      ✓       │
│ DeFi Router (autor.) │ Condicional *1 │ Condicional *1 │      ✗       │
│ Atacante/Tercero     │      ✗ (0)     │      ✗ (0)     │      ✗ (0)   │
│ Script público       │      ✗ (0)     │      ✗ (0)     │      ✗ (0)   │
└──────────────────────┴────────────────┴────────────────┴──────────────┘

*1: DeFi Router solo puede leer si está explícitamente autorizado por
    el administrador del consorcio para ese usuario específico
```

### 3.4 Seguridad: Criptografía vs. Privacidad

```
NIVELES DE PRIVACIDAD EN LA RED RTGS
════════════════════════════════════════

Nivel 1: PRIVACIDAD A NIVEL DE FUNCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
balanceOf() no retorna números reales, solo 0 o saldo autorizado
→ Impide queries pasivas de saldos


Nivel 2: PRIVACIDAD A NIVEL DE BLOCKCHAIN (OPCIONAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Los eventos Transfer aún se emiten públicamente:
  emit Transfer(0xBankaool, 0xArkangeles, 1000000)
  → Los montos TRANSFIEREN se ven en logs

NOTA: Para máxima privacidad, se podría:
- Usar zero-knowledge proofs (zk-SNARK)
- Encriptar los montos en los eventos
- Usar proxy contracts con direcciones ocultas
→ Futuro enhancement (no en MVP)


Nivel 3: PRIVACIDAD A NIVEL DE CONSENSO (PoA Privada)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La red L1 es PRIVADA a Bankaool + Arkángeles
→ No hay exploradores públicos
→ No hay nodos públicos
→ Solo los 2 validadores ven todas las transacciones
```

---

## 4. PUERTA DE ENTRADA A DEFI: INTEROPERABILIDAD CON TELEPORTER

### 4.1 Arquitectura General: L1 Privada ↔ L1 Pública (Fuji)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ARQUITECTURA DE INTEROPERABILIDAD AVALANCHE TELEPORTER (AWM)        │
└──────────────────────────────────────────────────────────────────────┘

CADENA L1 PRIVADA (PoA - Bankaool + Arkángeles)
═══════════════════════════════════════════════════════════════════════
    │
    ├─ RTGS Settlement Engine (Liquidaciones privadas)
    ├─ Private Liquidity Token (Token privado con saldos ocultos)
    ├─ TxAllowList (Solo transacciones de bancos)
    └─ ContractDeployerAllowList (Solo contratos auditados)
    
    ┌─────────────────────────────────────────────────────────────────┐
    │ BRIDGE CONTRACT: L1PrivateToPublicBridge                       │
    │                                                                  │
    │ Funciones:                                                      │
    │ - lock(token, amount) → Bloquea token privado en L1            │
    │ - unlock(token, amount) → Libera token privado en L1           │
    │                                                                  │
    │ Teleporter Outgoing:                                           │
    │ - Envía mensaje certificado: "Bloquea 1M USD en Fuji"          │
    │ - Firma: Validadores de L1 Privada (Bankaool, Arkángeles)     │
    └─────────────────────────────────────────────────────────────────┘
    
    │ ▲
    │ │ Avalanche Warp Messaging (AWM)
    │ │ Validadores verifican consenso criptográficamente
    │ │ No hay bridge centralizado
    │ │ No hay intermediarios
    │ ▼
    
    ┌─────────────────────────────────────────────────────────────────┐
    │ BRIDGE CONTRACT: FujiToPrivateBridge                           │
    │                                                                  │
    │ Funciones:                                                      │
    │ - mint(token, amount) → Crea token privado en L1              │
    │ - burn(token, amount) → Destruye token privado en L1          │
    │                                                                  │
    │ Teleporter Incoming:                                           │
    │ - Recibe mensaje: "Mint 1M de token privado en L1"            │
    │ - Valida BLS agregado de validadores L1 Privada              │
    │ - Ejecuta Mint atómico (1:1 con el bloqueo en Fuji)           │
    └─────────────────────────────────────────────────────────────────┘
    
    ▲
    │ Avalanche Warp Messaging (AWM)
    │
    ▼
    
CADENA L1 PÚBLICA (Fuji Testnet - Protocolo DeFi)
═══════════════════════════════════════════════════════════════════════
    │
    ├─ USDC.e (Token de círculo bridgeado)
    ├─ AVAX (Token nativo de Avalanche)
    ├─ Uniswap V3 (Liquidity Pools)
    ├─ Aave V3 (Lending Protocol)
    └─ Otros protocolos DeFi públicos
    
    ┌─────────────────────────────────────────────────────────────────┐
    │ BRIDGE CONTRACT: BridgeDepositoryFuji                          │
    │                                                                  │
    │ Funciones:                                                      │
    │ - deposit(tokenPublico, amount) → Bloquea USDC.e en Fuji      │
    │ - withdraw(tokenPublico, amount) → Libera USDC.e en Fuji      │
    │                                                                  │
    │ Teleporter Outgoing:                                           │
    │ - Envía mensaje: "Desbloquea 1M USD en L1 Privada"            │
    │ - Firma: Validadores de Fuji (consenso Avalanche C-Chain)    │
    └─────────────────────────────────────────────────────────────────┘
```

### 4.2 Flujo de Liquidez: Bloqueo → Mint (Fungible Wrapped Token)

```
ESCENARIO: Bankaool quiere acceder a liquidez DeFi pública en Fuji
para obtener USDC.e o AVAX, pero sin perder privacidad bancaria

┌─────────────────────────────────────────────────────────────────────┐
│ FASE 1: BLOQUEO DE LIQUIDEZ (L1 PRIVADA → L1 PÚBLICA)              │
└─────────────────────────────────────────────────────────────────────┘

Paso 1: Bankaool aprende que necesita 5M USD de liquidez pública

Paso 2: Bankaool ejecuta transacción en L1 Privada:
        
        contract L1PrivateToPublicBridge {
            function lockPrivateTokens(
                address beneficiary,           // 0xBankaoolFuji
                uint256 amount                 // 5,000,000 USD
            ) external {
                // Paso A: Transferir tokens privados del banco al puente
                privateLiquidityToken.transferFrom(
                    msg.sender,                // 0xBankaool
                    address(this),             // Bridge contract
                    amount
                );
                
                // Paso B: Registrar bloqueo local
                lockedTokens[msg.sender] += amount;
                
                // Paso C: Emitir mensaje Teleporter certificado
                // Este mensaje será verificado por validadores de L1 Privada
                // y retransmitido a través de AWM
                teleporterMessenger.sendMessage(
                    destinationChainID = FujiChainID,
                    recipient = FujiBridgeContract,
                    message = {
                        messageType: "LOCK_CONFIRMATION",
                        amount: 5000000e6,
                        originBank: 0xBankaool,
                        destinationAddress: 0xBankaoolFuji,
                        nonce: [nonce_único],
                        timestamp: block.timestamp
                    }
                );
                
                emit TokensLocked(
                    msg.sender,
                    amount,
                    "Enviados a Fuji",
                    FujiChainID
                );
            }
        }

Resultado Paso 2:
✓ Saldo de Bankaool: 5M - 5M = 0 USD (en L1 Privada)
✓ Escrow: +5M USD (bloqueado en L1 Privada, incapaz de mover)
✓ Mensaje Teleporter generado con firmas de Bankaool + Arkángeles

┌─────────────────────────────────────────────────────────────────────┐
│ FASE 2: VERIFICACIÓN CRIPTOGRÁFICA (L1 PRIVADA VALIDA)             │
└─────────────────────────────────────────────────────────────────────┘

Paso 3: Validadores de L1 Privada procesan el mensaje

        VALIDADOR 1 (Bankaool):
        ✓ Verifica que Bankaool tiene 5M USD
        ✓ Verifica que el mensaje fue emitido legítimamente
        ✓ FIRMA: Criptograma BLS del validador de Bankaool
        
        VALIDADOR 2 (Arkángeles):
        ✓ Verifica que Bankaool tiene 5M USD
        ✓ Verifica que el mensaje fue emitido legítimamente
        ✓ FIRMA: Criptograma BLS del validador de Arkángeles

Paso 4: Ambas firmas se AGREGAN usando BLS (Boneh-Lynn-Shacham):
        
        BLS_aggregated_signature = Combine(
            signature_bankaool,
            signature_arkangeles
        )
        
        // Resultado: Una firma de 96 bytes que prueba que
        // AMBOS validadores (2/2) autorizaron esta transacción

┌─────────────────────────────────────────────────────────────────────┐
│ FASE 3: TRANSMISIÓN A TRAVÉS DE AWM (Avalanche Warp Messaging)     │
└─────────────────────────────────────────────────────────────────────┘

Paso 5: Mensaje certificado viaja a través de AWM

        ┌─────────────────────────────────────────┐
        │ MENSAJE TELEPORTER CERTIFICADO         │
        ├─────────────────────────────────────────┤
        │ sourceChainID: RTGS_L1_PRIVADA          │
        │ destinationChainID: FujiChainID         │
        │ senderAddress: L1PrivateBridge          │
        │ recipientAddress: FujiBridge            │
        │                                         │
        │ payload: {                              │
        │   messageType: "LOCK_CONFIRMATION",    │
        │   amount: 5000000e6,                    │
        │   originBank: 0xBankaool,              │
        │   destinationAddress: 0xBankaoolFuji,  │
        │   nonce: [unique_nonce],                │
        │   timestamp: 1715779202                 │
        │ }                                       │
        │                                         │
        │ signedMessage: {                        │
        │   BLS_aggregated_signature,             │
        │   validator_bitmap: 0b11 (ambos)        │
        │ }                                       │
        │                                         │
        │ blockHash: 0xL1PrivadaBlockHash        │
        └─────────────────────────────────────────┘

Paso 6: Validadores de Fuji reciben el mensaje y lo procesan

        FUJI VALIDATORS (Consenso Avalanche C-Chain):
        ✓ Verifican que el BLS_signature es válido
        ✓ Verifican que el blockHash existe en L1 Privada
        ✓ Verifican que 2/2 validadores de L1 Privada firmaron
        ✓ CONFÍAN en el mensaje (porque está criptográficamente
          verificado por los nodos de L1 Privada)

┌─────────────────────────────────────────────────────────────────────┐
│ FASE 4: MINT 1:1 EN FUJI (Creación de Wrapped Token)               │
└─────────────────────────────────────────────────────────────────────┘

Paso 7: Bridge en Fuji ejecuta el Mint

        contract FujiBridgeDepositary {
            function receiveMessage(
                bytes calldata encodedMessage,
                bytes calldata signatures
            ) external onlyTeleporter {
                
                // Descodificar mensaje
                BridgeMessage memory msg = decodeMessage(encodedMessage);
                
                // Validar firma BLS
                require(
                    verifyBLSSignature(msg.blockHash, signatures),
                    "Invalid BLS signature"
                );
                
                // ✓ MINT: Crear token wrapped 1:1
                wrappedPrivateToken.mint(
                    msg.destinationAddress,    // 0xBankaoolFuji
                    msg.amount                 // 5,000,000 wrapped LIQ
                );
                
                emit TokensMinted(
                    msg.originBank,
                    msg.destinationAddress,
                    msg.amount,
                    msg.messageType
                );
            }
        }

Resultado Paso 7:
✓ Saldo de 0xBankaoolFuji: 5,000,000 wrapped LIQ tokens
✓ Estos tokens pueden ser intercambiados en Uniswap, Aave, etc.
✓ Garantía: 1:1 backed por tokens bloqueados en L1 Privada

┌─────────────────────────────────────────────────────────────────────┐
│ FASE 5: OPERACIONES DEFI EN FUJI                                   │
└─────────────────────────────────────────────────────────────────────┘

Paso 8: Bankaool puede usar el wrapped token en DeFi Fuji

        // Ejemplo: Intercambiar wrapped LIQ por USDC en Uniswap
        uniswapRouter.swapExactTokensForTokens(
            5000000e6,           // 5M wrapped LIQ
            minAmountOut,        // Slippage control
            path: [wrappedLIQ, USDC.e],
            to: 0xBankaoolFuji,
            deadline
        );
        
        // Resultado: 0xBankaoolFuji obtiene 5M USDC.e
        // (o equivalente según price del mercado)

┌─────────────────────────────────────────────────────────────────────┐
│ FASE 6: RETORNO A L1 PRIVADA (BURN → UNLOCK)                      │
└─────────────────────────────────────────────────────────────────────┘

Paso 9: Para regresar a L1 Privada, ejecuta:

        contract FujiBridgeDepositary {
            function burnAndReturnToBridge(
                uint256 amount
            ) external {
                
                // BURN: Destruir wrapped token
                wrappedPrivateToken.burn(msg.sender, amount);
                
                // Enviar mensaje Teleporter a L1 Privada
                teleporterMessenger.sendMessage(
                    destinationChainID = RTGS_L1_PRIVADA,
                    recipient = L1PrivateBridge,
                    message: {
                        messageType: "UNLOCK_REQUEST",
                        amount: amount,
                        originBank: msg.sender,  // 0xBankaoolFuji
                        destinationAddress: 0xBankaool,
                        nonce: [unique_nonce]
                    }
                );
                
                emit TokensBurned(msg.sender, amount);
            }
        }

Paso 10: L1 Privada recibe mensaje de unlock

        contract L1PrivateToPublicBridge {
            function receiveUnlockMessage(
                bytes calldata encodedMessage
            ) external onlyTeleporter {
                
                UnlockMessage memory msg = decodeMessage(encodedMessage);
                
                // UNLOCK: Liberar tokens bloqueados
                privateLiquidityToken.transfer(
                    msg.destinationAddress,  // 0xBankaool
                    msg.amount              // 5M USD
                );
                
                emit TokensUnlocked(
                    msg.originBank,
                    msg.destinationAddress,
                    msg.amount
                );
            }
        }

Resultado:
✓ 0xBankaool recupera 5M USD en L1 Privada
✓ El token wrapped se destruyó en Fuji
✓ Garantía: 1:1 preservada

RESUMEN DEL FLUJO
════════════════════════════════════════
L1 Privada        LOCK 5M USD
      ├─────────► Token bloqueado en escrow
      │
      └─ Mensaje Teleporter (BLS 2/2)
                 │
                 ▼ AWM Verification
                 │
                 ├─────────► Fuji
                            │
                            ├─ MINT 5M wrapped LIQ
                            │
                            ├─ Usar en DeFi (Uniswap, Aave)
                            │
                            ├─ BURN wrapped LIQ
                            │
                            └─ Mensaje Teleporter (BLS 1/1 Fuji)
                                 │
                                 ▼ AWM Verification
                                 │
                 ┌─────────► L1 Privada
                 │
                 ├─ UNLOCK 5M USD
                 │
                 ▼ Saldo restaurado
```

### 4.3 KYB Gateway: Validación de Beneficiarios

```solidity
/**
 * @title KYBGateway (Know-Your-Business Gateway)
 * @notice Verificación de identidad/cumplimiento antes de recibir fondos
 * 
 * Problemas prevenidos:
 * - Lavado de dinero (AML)
 * - Financiamiento de terrorismo (CTF)
 * - Sanciones internacionales (SDN lists)
 */
contract KYBGateway {
    
    // Whitelist de beneficiarios autorizados para recibir desde L1 Privada
    mapping(address => bool) public isAuthorizedBeneficiary;
    
    // KYB status: 0 = pending, 1 = approved, 2 = rejected
    mapping(address => uint8) public kybStatus;
    
    event BeneficiaryApproved(address indexed beneficiary);
    event BeneficiaryRejected(address indexed beneficiary);
    
    /**
     * @notice Ejecuta verificación KYB antes de desbloquear fondos
     * @dev Esta función se llama DENTRO del contrato de Bridge
     */
    function validateBeneficiary(address beneficiary) 
        public 
        view 
        returns (bool) 
    {
        // Si no está en whitelist, ABORTA la transacción
        require(isAuthorizedBeneficiary[beneficiary], 
            "KYB_FAILED: Beneficiary not authorized");
        
        // Si KYB fue rechazado explícitamente, ABORTA
        require(kybStatus[beneficiary] != 2, 
            "KYB_FAILED: Beneficiary flagged for sanctions");
        
        return true;
    }
}

/**
 * INTEGRACIÓN EN BRIDGE
 */
contract FujiBridgeDepositary {
    
    KYBGateway public kybGateway;
    
    function burnAndReturnToBridge(uint256 amount) external {
        
        // ✓ VALIDAR KYB ANTES DE PROCESAR
        require(
            kybGateway.validateBeneficiary(msg.sender),
            "KYB validation failed"
        );
        
        // Si pasó KYB, procesar normalmente
        wrappedPrivateToken.burn(msg.sender, amount);
        
        teleporterMessenger.sendMessage(...);
    }
}

/**
 * ESCENARIO DE FALLO: Intento de enviar fondos a dirección no autorizada
 * 
 * Atacante intenta:
 *   0xMaliciousAddress.burnAndReturnToBridge(1000000)
 * 
 * Resultado:
 *   ✗ KYB validation failed
 *   ✗ Transaction REVERTED
 *   ✗ Fondos NO transferidos
 *   ✗ Logs de auditoría registran intento
 */
```

---

## RESUMEN ARQUITECTÓNICO (CHECKLIST DE IMPLEMENTACIÓN)

```
┌─────────────────────────────────────────────────────────────────┐
│ PILARES DE DISEÑO - VERIFICACIÓN DE COBERTURA                  │
└─────────────────────────────────────────────────────────────────┘

[✓] PILAR 1: RTGS SOBERANO
    ├─ PoA con 2 validadores (Bankaool, Arkángeles)
    ├─ Tiempo de bloque: 2 segundos
    ├─ Finality: Instantánea (1 bloque)
    ├─ Transacciones: ~1,000 tx/s
    └─ Consenso: Firmas multiples

[✓] PILAR 2: ISO 20022 + EIP-712 + EIP-2612
    ├─ Motor RTGSSettlementEngine
    ├─ Procesamiento pacs.009 en blockchain
    ├─ Firmas EIP-712 off-chain
    ├─ Permit (EIP-2612) para autorización implícita
    ├─ Liquidación atómica: 1 tx = transferencia + registro
    └─ Sub-2s garantizado

[✓] PILAR 3: PRIVACIDAD SELECTIVA
    ├─ ERC-20 personalizado con restricciones
    ├─ balanceOf() retorna 0 para no autorizados
    ├─ Lectura solo para: propietario, auditores, DeFi autorizados
    ├─ Transferencias funcionan sin exponer saldos
    └─ Cumplimiento de secreto bancario

[✓] PILAR 4: INTEROPERABILIDAD TELEPORTER
    ├─ Bridge L1 Privada ← AWM → Fuji
    ├─ Bloqueo en L1 Privada → Mint en Fuji (1:1)
    ├─ Acceso a DeFi pública (Uniswap, Aave)
    ├─ Burn en Fuji → Unlock en L1 Privada
    ├─ KYB Gateway para validación de beneficiarios
    └─ Verificación criptográfica (BLS 2/2)

```

---

## SIGUIENTE FASE: CONFIGURACIÓN DE AVALANCHE CLI

Una vez que valides esta especificación arquitectónica, procederemos a:

1. **Genesis Configuration** (JSON) 
   - Precompilados (ContractDeployerAllowList, TxAllowList)
   - Parámetros de gas (token nativo personalizado)
   - Validadores iniciales (Bankaool, Arkángeles)

2. **Comandos de Deployment** 
   - `avalanche blockchain create rtgs-l1-private`
   - Configuración de red privada
   - Despliegue de contratos fundacionales

3. **Scripts de Testing**
   - Validación de RTGSSettlementEngine
   - Pruebas de privacidad de balances
   - Simulación de Teleporter (mockups)

---

## REFERENCIAS Y ESPECIFICACIONES

- **Avalanche Evergreen Subnets:** https://docs.avax.network/subnets/
- **Avalanche Teleporter (AWM):** https://docs.avax.network/teleporter/
- **Subnet-EVM:** https://github.com/ava-labs/subnet-evm
- **ISO 20022:** https://www.iso20022.org/
- **EIP-712 (Typed structured data hashing):** https://eips.ethereum.org/EIPS/eip-712
- **EIP-2612 (Permit extension for ERC-20):** https://eips.ethereum.org/EIPS/eip-2612
- **BLS Signatures:** https://en.wikipedia.org/wiki/Boneh%E2%80%93Lynn%E2%80%93Shacham

---

**Documento preparado para:** Hackathon Avalanche - Equipo 1 Latinoamérica  
**Validación Requerida Antes de:** Generación de JSON Genesis y Comandos CLI

