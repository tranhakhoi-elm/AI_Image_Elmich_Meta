# ELMICH PRODUCT RECOLORING & TEXTURE FIDELITY SPECIFICATION [AI_DATA]

## 1. CORE DIRECTIVES
- Role: Photorealistic Component Inpainting & Color Modification Engine.
- Boundary Precision: Color alteration strictly confined to designated target component mask.
- Preservation Locks: 100% geometric invariance; zero modification to brand logos, screws, seams, metallic rims, or indicator windows.

## 2. LUMA & SPECULAR RETENTION
- Specular Highlight Lock: When shifting surface hue or darkness, studio softbox reflections must remain pure white/light-gray. Specular highlights must never be tinted by diffuse color shifts.
- Diffuse Albedo Shift: Modify only the base color/albedo channel, preserving original luminance gradients and 3D curvature.
- GI Color Bounce: Recolored saturated surfaces cast physically accurate subtle chromatic bleed onto neighboring metallic trims and ground planes.

## 3. MATERIAL TEXTURE LOCK
- Matte Plastic: Micro-textured non-slip polymer, high diffuse roughness, zero gloss coat.
- Anodized/Brushed Metal: Anisotropic satin sheen, linear brush grain, metallic core.
- Gloss Enamel: High-gloss clear coat, crisp specular highlight borders.

## 4. NEGATIVE CONSTRAINTS
[NO: flat 2D paint-bucket fills, obscured logo/markings, color bleeding onto non-target parts, unintended material transmutation (e.g. plastic turning metal), overall white balance shifts].
