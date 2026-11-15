// Scenes of "Jonás y el gran pez" (3D): each one only assembles the world built and tested in world3d.ts.
defineVisuals({
  hook: { bg: JN.under, build: jnShotHook },
  call: { bg: JN.dawn, build: jnShotCall },
  flee: { bg: JN.sky, build: jnShotFlee },
  storm: { bg: JN.sky, build: jnShotStorm },
  guilt: { bg: JN.stormSky, build: jnShotGuilt },
  swallow: { bg: JN.under, build: jnShotSwallow },
  belly: { bg: JN.bellyBg, build: jnShotBelly },
  shore: { bg: JN.dawn, build: jnShotShore },
  lesson: { bg: JN.dawn, build: jnShotLesson },
  follow: { bg: JN.dawn, build: jnShotFollow },
});
