// Post-processing: bloom on lamps/sun/marker/lit windows, gentle colour
// grading, neutral tone mapping and a soft vignette. Scaled by the effects tier.
// (Screen-space AO was tried and dropped: it darkened the whole frame and cost
// a lot on mid-range GPUs; contact shadows are baked into textures instead.)
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export type FxTier = 0 | 1 | 2;

export function Effects({ tier }: { tier: FxTier }) {
  if (tier === 0) return null;
  return (
    <EffectComposer multisampling={tier === 2 ? 4 : 0} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={tier === 2 ? 0.75 : 0.55} radius={0.7} />
      <HueSaturation saturation={0.05} />
      <BrightnessContrast brightness={0.01} contrast={0.04} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.35} darkness={0.32} />
    </EffectComposer>
  );
}
