// Scenes of "Jonás y el gran pez" (3D): each one only assembles the world built and tested in world3d.ts.
defineVisuals({
  hook: { bg: JN.under, build: jnCine(jnShotHook) },
  call: { bg: JN.dawn, build: jnCine(jnShotCall) },
  flee: { bg: JN.sky, build: jnCine(jnShotFlee) },
  storm: { bg: JN.sky, build: jnCine(jnShotStorm) },
  guilt: { bg: JN.stormSky, build: jnCine(jnShotGuilt) },
  swallow: { bg: JN.under, build: jnCine(jnShotSwallow) },
  belly: { bg: JN.bellyBg, build: jnCine(jnShotBelly, { env: 0, vignette: 1.1 }) },
  shore: { bg: JN.dawn, build: jnCine(jnShotShore) },
  lesson: { bg: JN.dawn, build: jnCine(jnShotLesson) },
  follow: { bg: JN.dawn, build: jnCine(jnShotFollow) },
});
