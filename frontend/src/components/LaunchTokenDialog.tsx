import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Rocket } from 'lucide-react';
import { CurveParametersForm } from './CurveParametersForm';
import { LaunchPreview } from './LaunchPreview';

export type CurveType = 'linear' | 'exponential' | 'sigmoid';

export interface CurveParameters {
  basePrice: number;
  slope: number;
  k: number;
  maxPrice: number;
  graduationThreshold: number;
}

export interface TokenLaunchFormData {
  name: string;
  symbol: string;
  initialSupply: number;
  curveType: CurveType;
  curveParameters: CurveParameters;
  creatorCommitment: string;
}

interface ValidationErrors {
  name?: string;
  symbol?: string;
  initialSupply?: string;
  basePrice?: string;
  creatorCommitment?: string;
}

const DEFAULT_CURVE_PARAMS: Record<CurveType, CurveParameters> = {
  linear: {
    basePrice: 0.0001,
    slope: 0.00001,
    k: 1,
    maxPrice: 1.0,
    graduationThreshold: 69000,
  },
  exponential: {
    basePrice: 0.0001,
    slope: 0.00001,
    k: 1.5,
    maxPrice: 2.0,
    graduationThreshold: 69000,
  },
  sigmoid: {
    basePrice: 0.0001,
    slope: 0.00001,
    k: 2.0,
    maxPrice: 1.5,
    graduationThreshold: 69000,
  },
};

export function LaunchTokenDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'parameters' | 'preview'>('form');
  const [formData, setFormData] = useState<TokenLaunchFormData>({
    name: '',
    symbol: '',
    initialSupply: 800000000,
    curveType: 'linear',
    curveParameters: DEFAULT_CURVE_PARAMS.linear,
    creatorCommitment: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateBasicForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Token name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Token name must be at least 3 characters';
    } else if (formData.name.length > 32) {
      newErrors.name = 'Token name must be less than 32 characters';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Token symbol is required';
    } else if (formData.symbol.length < 2) {
      newErrors.symbol = 'Symbol must be at least 2 characters';
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be less than 10 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.symbol)) {
      newErrors.symbol = 'Symbol must contain only uppercase letters and numbers';
    }

    if (formData.initialSupply < 1000000) {
      newErrors.initialSupply = 'Initial supply must be at least 1,000,000';
    } else if (formData.initialSupply > 1000000000000) {
      newErrors.initialSupply = 'Initial supply must be less than 1 trillion';
    }

    if (!formData.creatorCommitment.trim()) {
      newErrors.creatorCommitment = 'Creator commitment (for privacy) is required';
    } else if (!/^0x[a-fA-F0-9]{64}$/.test(formData.creatorCommitment)) {
      newErrors.creatorCommitment = 'Invalid commitment format (must be 32-byte hex string)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'form') {
      if (validateBasicForm()) {
        setStep('parameters');
      }
    } else if (step === 'parameters') {
      setStep('preview');
    }
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('parameters');
    } else if (step === 'parameters') {
      setStep('form');
    }
  };

  const handleCurveTypeChange = (value: CurveType) => {
    setFormData({
      ...formData,
      curveType: value,
      curveParameters: DEFAULT_CURVE_PARAMS[value],
    });
  };

  const handleParametersChange = (params: CurveParameters) => {
    setFormData({
      ...formData,
      curveParameters: params,
    });
  };

  const handleLaunch = async () => {
    // This will be connected to the actual launch logic
    console.log('Launching token with data:', formData);
    // TODO: Integrate with backend API
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setStep('form');
    setFormData({
      name: '',
      symbol: '',
      initialSupply: 800000000,
      curveType: 'linear',
      curveParameters: DEFAULT_CURVE_PARAMS.linear,
      creatorCommitment: '',
    });
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Rocket className="h-5 w-5" />
          Launch Token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            Launch New Token
          </DialogTitle>
          <DialogDescription>
            {step === 'form' && 'Create your privacy-preserving token on Zumpfun'}
            {step === 'parameters' && 'Configure your bonding curve parameters'}
            {step === 'preview' && 'Review and confirm your token launch'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="name">Token Name</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        The full name of your token (e.g., "Meme Coin"). This will be visible to all users.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="name"
                placeholder="e.g., Meme Coin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="symbol">Token Symbol</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        The ticker symbol for your token (e.g., "MEME"). Must be uppercase letters and numbers only.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="symbol"
                placeholder="e.g., MEME"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className={errors.symbol ? 'border-red-500' : ''}
                maxLength={10}
              />
              {errors.symbol && (
                <p className="text-sm text-red-500">{errors.symbol}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="supply">Initial Supply</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Total number of tokens to create. Default is 800M. This cannot be changed after launch.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="supply"
                type="number"
                placeholder="800000000"
                value={formData.initialSupply}
                onChange={(e) => setFormData({ ...formData, initialSupply: parseInt(e.target.value) || 0 })}
                className={errors.initialSupply ? 'border-red-500' : ''}
              />
              {errors.initialSupply && (
                <p className="text-sm text-red-500">{errors.initialSupply}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {formData.initialSupply.toLocaleString()} tokens
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="curveType">Bonding Curve Type</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Choose how your token price increases with demand:
                        <br />• Linear: Steady growth
                        <br />• Exponential: Accelerating growth
                        <br />• Sigmoid: S-curve growth
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={formData.curveType} onValueChange={handleCurveTypeChange}>
                <SelectTrigger id="curveType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear (Steady Growth)</SelectItem>
                  <SelectItem value="exponential">Exponential (Fast Growth)</SelectItem>
                  <SelectItem value="sigmoid">Sigmoid (S-Curve)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="commitment">Creator Commitment</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Privacy commitment (32-byte hex string). This ensures your identity remains private while proving token ownership.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="commitment"
                placeholder="0x..."
                value={formData.creatorCommitment}
                onChange={(e) => setFormData({ ...formData, creatorCommitment: e.target.value })}
                className={errors.creatorCommitment ? 'border-red-500' : ''}
              />
              {errors.creatorCommitment && (
                <p className="text-sm text-red-500">{errors.creatorCommitment}</p>
              )}
            </div>

            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                All token launches on Zumpfun are privacy-preserving. Your identity and trading activity remain confidential.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'parameters' && (
          <CurveParametersForm
            curveType={formData.curveType}
            parameters={formData.curveParameters}
            onChange={handleParametersChange}
          />
        )}

        {step === 'preview' && (
          <LaunchPreview
            formData={formData}
            onEdit={() => setStep('form')}
          />
        )}

        <div className="flex justify-between pt-4">
          {step !== 'form' && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {step === 'form' && <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            {step !== 'preview' ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleLaunch}>
                Launch Token
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
