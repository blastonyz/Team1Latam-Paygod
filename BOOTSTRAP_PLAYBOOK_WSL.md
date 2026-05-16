# Avalanche L1 Bootstrap Playbook (WSL)

Este documento resume la solucion que funciono para evitar timeouts de bootstrap y errores de VM en despliegues locales de Avalanche L1 con VM custom.

## 1) Punto de partida recomendado

- Trabajar y compilar en WSL nativo: `/home/blasmov/precompile-evm`
- Evitar compilar desde `/mnt/c/...` para reducir problemas de I/O y red.

## 2) Build de VM custom

```bash
cd ~/precompile-evm
./scripts/build.sh
```

Binario esperado:

```bash
ls -lh /home/blasmov/.avalanchego/plugins/srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy
```

## 3) Arranque limpio de red local

```bash
pkill -f avalanchego || true
rm -rf ~/.avalanche-cli/runs/network_*
avalanche network start
```

## 4) Crear blockchain (wizard actual)

En esta version de CLI, `blockchain create` no usa `--vm` directo por flag.

```bash
avalanche blockchain create pay3 \
	--force \
	--genesis /home/blasmov/precompile-evm/.devcontainer/genesis-example.json
```

En el wizard:

- `Custom VM`
- VM binary path:
	`/home/blasmov/.avalanchego/plugins/srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy`

## 5) Deploy local

```bash
AVALANCHE_CLI_NETWORK_TIMEOUT=20m avalanche blockchain deploy pay3 --local
```

Si pregunta overwrite de deploy local existente, elegir `Yes`.

## 6) Error critico detectado: vmFactory not found

Error tipico en logs:

```text
error creating chain ... error while getting vmFactory: "<VM_ID>" was not found
```

Esto significa que la chain espera un VM ID especifico y no existe un binario con ese nombre en `~/.avalanchego/plugins`.

### Fix

```bash
VMID=$(avalanche blockchain describe pay3 | awk -F'|' '/VM ID/{gsub(/ /,"",$3); print $3}')
SRC=/home/blasmov/.avalanchego/plugins/srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy
DST=/home/blasmov/.avalanchego/plugins/$VMID

cp "$SRC" "$DST"
chmod +x "$DST"

pkill -f avalanchego || true
avalanche network start
AVALANCHE_CLI_NETWORK_TIMEOUT=20m avalanche blockchain deploy pay3 --local
```

## 7) Error: address already in use (9650)

```bash
pkill -f avalanchego || true
sudo fuser -k 9650/tcp || true
sudo fuser -k 9651/tcp || true
```

## 8) DNS/TLS intermitente en WSL (si reaparece)

Si aparecen `TLS handshake timeout` o `lookup ... i/o timeout`, revisar DNS.

Estado recomendado:

```bash
cat /etc/resolv.conf
getent hosts proxy.golang.org
curl -4 https://proxy.golang.org
```

Si `/etc/resolv.conf` es un symlink roto, reemplazar por archivo real:

```bash
sudo rm -f /etc/resolv.conf
sudo sh -c 'cat >/etc/resolv.conf <<EOF
nameserver 1.1.1.1
nameserver 8.8.8.8
EOF'
```

## 9) Verificacion final

```bash
avalanche blockchain list --deployed
avalanche blockchain describe pay3
```

Para usar `cast`, usar URL real RPC:

```bash
RPC_URL="http://127.0.0.1:9650/ext/bc/<BLOCKCHAIN_ID>/rpc"
cast block-number --rpc-url "$RPC_URL"
```

## 10) Nota sobre error final visto

Si aparece:

```text
Error: no contract code at given address
```

suele indicar mismatch entre direccion esperada y contrato realmente desplegado en ese RPC/chain. Verificar:

1. que el RPC apunta al `BLOCKCHAIN_ID` correcto
2. que el contrato fue desplegado en esa red
3. que no se esta usando una direccion de una corrida previa

