// Post-processing: bloom on lamps/sun/marker/lit windows, gentle colour
// grading, neutral tone mapping and a soft vignette. Scaled by the effects tier.
// (Screen-space AO was tried and dropped: it darkened the whole frame and cost
// a lot on mid-range GPUs; contact shadows are baked into textures instead.)
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, BrightnessContrast, DepthOfField, EffectComposer, HueSaturation, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing';
import { cine } from './refs';

export type FxTier = 0 | 1 | 2;

/** Background blur that fades in during conversations, focused on whoever is framed. */
function DialogueBlur() {
  const ref = useRef<DepthOfFieldEffect>(null);
  useFrame(() => {
    const e = ref.current;
    if (!e) return;
    e.bokehScale = cine.amount * 2.4;
    e.target = cine.focus ?? null;
  });
  // keep everything within ~3 m of the focus sharp, so both speakers stay crisp
  return <DepthOfField ref={ref} worldFocusRange={3} bokehScale={0} />;
}

export function Effects({ tier }: { tier: FxTier }) {
  if (tier === 0) return null;
  return (
    <EffectComposer multisampling={tier === 2 ? 4 : 0} enableNormalPass={false}>
      {tier === 2 ? <DialogueBlur /> : <></>}
      <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={tier === 2 ? 0.75 : 0.55} radius={0.7} />
      <HueSaturation saturation={0.05} />
      <BrightnessContrast brightness={0.01} contrast={0.04} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.35} darkness={0.32} />
    </EffectComposer>
  );
}
