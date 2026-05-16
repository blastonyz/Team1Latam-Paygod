import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const encryptedDir = path.resolve(rootDir, "..", "EncryptedERC");
const artifactsDir = path.join(encryptedDir, "artifacts", "contracts");
const outDir = path.join(rootDir, "lib", "abi");

const contracts = [
  { name: "EncryptedERC", rel: ["EncryptedERC.sol", "EncryptedERC.json"] },
  { name: "Registrar", rel: ["Registrar.sol", "Registrar.json"] },
  { name: "GenericTransferBurnToken", rel: ["tokens", "GenericTransferBurnToken.sol", "GenericTransferBurnToken.json"] }
];

const readArtifact = (segments) => {
  const artifactPath = path.join(artifactsDir, ...segments);
  if (!fs.existsSync(artifactPath)) throw new Error(`Artifact not found: ${artifactPath}`);
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
};

fs.mkdirSync(outDir, { recursive: true });

for (const contract of contracts) {
  const artifact = readArtifact(contract.rel);
  const outputPath = path.join(outDir, `${contract.name}.json`);
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify({ contractName: artifact.contractName, abi: artifact.abi }, null, 2)}\n`,
    "utf8",
  );
}

console.log(`Synced ${contracts.length} ABIs to ${outDir}`);
