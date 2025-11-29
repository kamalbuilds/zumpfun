import { useState, useCallback } from 'react';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';

interface ProofInputs {
  circuitName: string;
  inputs: Record<string, any>;
}

interface ProofResult {
  proof: Uint8Array;
  publicInputs: string[];
}

// Circuit manifests (these would be loaded from your compiled circuits)
const CIRCUIT_MANIFESTS: Record<string, any> = {
  contribution: null, // Will be loaded dynamically
  trade: null,
  ownership: null,
};

export const useNoirProver = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proofProgress, setProofProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load circuit manifest from backend
   */
  const loadCircuitManifest = useCallback(async (circuitName: string) => {
    try {
      // In production, fetch from backend or IPFS
      const response = await fetch(`/api/circuits/${circuitName}/manifest.json`);
      if (!response.ok) {
        throw new Error(`Failed to load circuit manifest: ${circuitName}`);
      }
      const manifest = await response.json();
      CIRCUIT_MANIFESTS[circuitName] = manifest;
      return manifest;
    } catch (err) {
      console.error(`Error loading circuit manifest:`, err);
      throw new Error(`Circuit ${circuitName} not available`);
    }
  }, []);

  /**
   * Generate ZK proof using Noir
   */
  const generateProof = useCallback(
    async ({ circuitName, inputs }: ProofInputs): Promise<ProofResult> => {
      setIsGenerating(true);
      setProofProgress(0);
      setError(null);

      try {
        // Load circuit manifest if not cached
        if (!CIRCUIT_MANIFESTS[circuitName]) {
          setProofProgress(10);
          await loadCircuitManifest(circuitName);
        }

        const manifest = CIRCUIT_MANIFESTS[circuitName];
        if (!manifest) {
          throw new Error(`Circuit ${circuitName} not found`);
        }

        setProofProgress(20);

        // Initialize Barretenberg backend (WASM-based)
        const backend = new BarretenbergBackend(manifest);
        setProofProgress(40);

        // Initialize Noir prover
        const noir = new Noir(manifest, backend);
        setProofProgress(60);

        // Generate witness
        const { witness, returnValue } = await noir.execute(inputs);
        setProofProgress(80);

        // Generate proof (second parameter is compression flag)
        const proof = await backend.generateProof(witness, true);
        setProofProgress(100);

        // Extract public inputs
        const publicInputs = returnValue ? [returnValue] : [];

        return {
          proof: proof.proof,
          publicInputs: publicInputs.map((x: any) => x.toString()),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error during proof generation';
        setError(errorMessage);
        console.error('Proof generation error:', err);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [loadCircuitManifest]
  );

  /**
   * Verify ZK proof
   */
  const verifyProof = useCallback(
    async (
      circuitName: string,
      proof: Uint8Array,
      publicInputs: string[]
    ): Promise<boolean> => {
      try {
        // Load circuit manifest if not cached
        if (!CIRCUIT_MANIFESTS[circuitName]) {
          await loadCircuitManifest(circuitName);
        }

        const manifest = CIRCUIT_MANIFESTS[circuitName];
        if (!manifest) {
          throw new Error(`Circuit ${circuitName} not found`);
        }

        // Initialize backend and Noir
        const backend = new BarretenbergBackend(manifest);
        const noir = new Noir(manifest, backend);

        // Verify proof (second parameter is compression flag)
        const isValid = await backend.verifyProof(proof, true);

        return isValid;
      } catch (err) {
        console.error('Proof verification error:', err);
        return false;
      }
    },
    [loadCircuitManifest]
  );

  /**
   * Serialize proof for contract submission
   */
  const serializeProof = useCallback((proof: Uint8Array, publicInputs: string[]) => {
    return {
      proof: Array.from(proof),
      publicInputs: publicInputs,
    };
  }, []);

  /**
   * Generate ownership proof (for proving contribution ownership without revealing amount)
   */
  const generateOwnershipProof = useCallback(
    async (contributionProof: ProofResult, secret: string) => {
      return generateProof({
        circuitName: 'ownership',
        inputs: {
          originalProof: contributionProof.proof,
          secret: secret,
        },
      });
    },
    [generateProof]
  );

  return {
    generateProof,
    verifyProof,
    serializeProof,
    generateOwnershipProof,
    isGenerating,
    proofProgress,
    error,
  };
};
