# Camera Guide — Cinematic Video Prompts

Reference for writing video prompts with professional camera language. AI video models understand these terms and produce significantly more cinematic output.

## Camera Angles

| Angle | Prompt keywords | Effect | Best for |
|-------|----------------|--------|----------|
| **Eye level** | `eye level shot` | Neutral, natural | Dialogue, normal scenes |
| **Low angle** | `low angle shot, looking up at subject` | Power, heroism, dominance | Hero moments, reveals |
| **High angle** | `high angle shot, looking down` | Vulnerability, smallness | Emotional scenes, isolation |
| **Bird's eye** | `top-down overhead shot, bird's eye view` | Scale, context, patterns | Establishing, maps, crowds |
| **Worm's eye** | `extreme low angle from ground level` | Dramatic, towering | Buildings, giants, epic moments |
| **Dutch angle** | `tilted camera angle, Dutch angle` | Tension, unease, chaos | Conflict, horror, disorientation |
| **Over-the-shoulder** | `over-the-shoulder shot, OTS` | Connection, dialogue | Conversations, reveals |
| **POV** | `first-person POV, point of view shot` | Immersion | Action, discovery, horror |

## Camera Movements

| Movement | Prompt keywords | Effect | Best for |
|----------|----------------|--------|----------|
| **Push in** | `slow push in toward subject, dolly in` | Building tension, focus | Dramatic reveals, emotional peaks |
| **Pull back** | `camera pulls back slowly, dolly out` | Reveal, scale, isolation | Plot twists, establishing context |
| **Tracking** | `camera tracks alongside subject, tracking shot` | Following action | Walking, running, chasing |
| **Orbit** | `camera orbits around subject, 360 arc` | Epicness, showcase | Hero poses, objects, dance |
| **Crane up** | `camera cranes up, rising shot` | Grandeur, freedom, triumph | Endings, victories, reveals |
| **Crane down** | `camera descends, lowering crane shot` | Arrival, grounding | Beginnings, landings |
| **Pan** | `camera pans left/right slowly` | Survey, follow, transition | Landscapes, scanning rooms |
| **Tilt** | `camera tilts up/down` | Scale reveal, top-to-bottom | Tall buildings, characters |
| **Whip pan** | `fast whip pan, motion blur` | Energy, surprise, transition | Action, comedy, time jumps |
| **Steadicam** | `smooth steadicam follow, gimbal shot` | Professional, flowing | Walk-and-talk, exploration |
| **Zoom** | `slow zoom in / slow zoom out` | Focus shift, mood | Tension, realization |
| **Static** | `locked camera, static shot, no movement` | Stillness, observation | Contemplation, tableaux |

## Depth of Field

| Technique | Prompt keywords | Effect |
|-----------|----------------|--------|
| **Shallow DOF** | `shallow depth of field, background blurred, bokeh` | Subject isolation, cinematic |
| **Deep focus** | `deep focus, everything sharp, wide depth of field` | Context, environment |
| **Rack focus** | `rack focus from foreground to background` | Shift attention between subjects |
| **Tilt-shift** | `tilt-shift effect, miniature look` | Toylike, whimsical |

## Lighting

| Technique | Prompt keywords | Mood |
|-----------|----------------|------|
| **Golden hour** | `golden hour, warm sunset light, long shadows` | Warmth, nostalgia, romance |
| **Blue hour** | `blue hour, twilight, cool blue ambient light` | Mystery, calm, melancholy |
| **Backlight** | `backlit subject, rim light, silhouette edge` | Drama, halo effect, mystery |
| **Side light** | `dramatic side lighting, half shadow on face` | Tension, duality |
| **Top light** | `overhead light, harsh downward shadows` | Interrogation, isolation |
| **Chiaroscuro** | `chiaroscuro lighting, strong contrast, dark shadows` | Drama, film noir |
| **Soft diffused** | `soft diffused light, overcast, even lighting` | Gentle, dreamy, safe |
| **Neon** | `neon glow, colored light reflections, cyberpunk lighting` | Futuristic, nightlife |
| **Volumetric** | `volumetric light, god rays, light shafts through fog` | Ethereal, sacred |

## Shot Types

| Shot | Prompt keywords | Shows |
|------|----------------|-------|
| **Extreme wide** | `extreme wide shot, vast landscape, tiny subject` | Environment, scale |
| **Wide** | `wide shot, full environment visible` | Setting + character |
| **Full body** | `full body shot, head to toe` | Character + action |
| **Medium** | `medium shot, waist up` | Upper body + expression |
| **Close-up** | `close-up shot, face fills frame` | Emotion, detail |
| **Extreme close-up** | `extreme close-up, macro, detail shot` | Eyes, hands, objects |
| **Two-shot** | `two-shot, both characters in frame` | Relationship, dialogue |

## Combining in Sub-clip Prompts

Apply different camera techniques to each time segment for maximum cinematic effect:

### Example: Hero Discovery Scene
```
0-2s: Wide establishing shot of Castle courtyard at dawn, camera slowly cranes down from the sky.
2-5s: Low angle tracking shot following Hero walking toward the glowing Magic Sword on the wall, shallow depth of field.
5-8s: Slow push in to extreme close-up of Hero's eyes reflecting the golden glow, rack focus from sword to face.
```

### Example: Emotional Moment
```
0-3s: Over-the-shoulder shot, Luna kneels at Chocolate River edge, soft diffused light, shallow DOF.
3-5s: Close-up of Luna's paw dipping into chocolate, slow motion, golden hour backlight.
5-8s: Medium shot, Luna looks up surprised, camera slowly orbits to reveal the vast chocolate landscape behind her.
```

### Example: Action Sequence
```
0-2s: Dutch angle low shot, Pippip leaps onto Fish Stall counter, whip pan motion blur.
2-5s: Dynamic tracking shot following three fish arcing through the air, crowd blurred in background.
5-8s: Crane up from Pippip catching the last fish to bird's eye view of the cheering Open Market crowd.
```

### Example: Peaceful Ending
```
0-3s: Medium shot, Pippip sits on stool eating Golden Fish, static camera, warm golden hour side light.
3-6s: Slow pull back revealing the empty Fish Stall with SOLD OUT sign, depth of field deepens.
6-8s: Wide shot, camera continues pulling back showing the quiet Open Market at sunset, volumetric light through the awnings.
```

## Common Mistakes

- "Camera zooms" — too vague. Say "slow push in" or "dolly zoom" instead.
- "Cinematic" alone — meaningless. Specify WHAT makes it cinematic (shallow DOF + golden hour + tracking shot).
- Too many movements in one segment — one camera move per 2-3s works best.
- Forgetting lighting — lighting is 50% of the cinematic look. Always specify.
- Mixing angles randomly — plan the emotional arc: wide (context) → medium (connection) → close-up (emotion) → wide (resolution).

## Emotional Arc Camera Pattern

Most cinematic scenes follow this progression:

```
Opening:  Wide/establishing + crane/pan    → sets the stage
Rising:   Medium + tracking/push in        → builds engagement
Peak:     Close-up + slow motion/static    → maximum emotional impact
Release:  Pull back to wide + crane up     → resolution, breathing room
```

Map this to your 8s sub-clip timing:
```
0-2s: Wide establishing, slow crane down       (opening)
2-5s: Medium tracking, push in toward subject   (rising)
5-7s: Close-up, shallow DOF, static or slow     (peak)
7-8s: Pull back to wide, crane up               (release)
```
