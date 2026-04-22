import fragments from "./fragments";

/**
 * Picks a random item from an array, avoiding the last used index.
 * Returns { text, index }.
 */
function pickFragment(pool, lastIndex = -1) {
  if (pool.length === 1) return { text: pool[0], index: 0 };
  let idx;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (idx === lastIndex);
  return { text: pool[idx], index: idx };
}

/**
 * Replaces template variables in context fragments.
 */
function interpolate(text, timeWorked, earnings) {
  return text
    .replace("{{timeWorked}}", timeWorked)
    .replace("{{earnings}}", earnings);
}

/**
 * Assembles a motivation message from fragments.
 * Rules:
 *   - context: required
 *   - reflection: required
 *   - opener: 60% chance
 *   - metaphor: 50% chance
 *   - value: 50% chance
 *   - closer: 70% chance
 *
 * @param {object} lastUsed - map of { [key]: lastIndex }
 * @param {string} timeWorked - formatted time string e.g. "2h 14m"
 * @param {string} earnings - formatted earnings string e.g. "₱412.00"
 * @returns {{ message: string, nextLastUsed: object }}
 */
export function assembleMotivation(lastUsed = {}, timeWorked, earnings) {
  const nextLastUsed = { ...lastUsed };
  const parts = [];

  // opener — 60% chance
  if (Math.random() < 0.6) {
    const { text, index } = pickFragment(fragments.opener, lastUsed.opener);
    parts.push(text);
    nextLastUsed.opener = index;
  }

  // context — required
  const ctx = pickFragment(fragments.context, lastUsed.context);
  parts.push(interpolate(ctx.text, timeWorked, earnings));
  nextLastUsed.context = ctx.index;

  // metaphor — 50% chance
  if (Math.random() < 0.5) {
    const { text, index } = pickFragment(fragments.metaphor, lastUsed.metaphor);
    parts.push(text);
    nextLastUsed.metaphor = index;
  }

  // value — 50% chance
  if (Math.random() < 0.5) {
    const { text, index } = pickFragment(fragments.value, lastUsed.value);
    parts.push(text);
    nextLastUsed.value = index;
  }

  // reflection — required
  const ref = pickFragment(fragments.reflection, lastUsed.reflection);
  parts.push(ref.text);
  nextLastUsed.reflection = ref.index;

  // closer — 70% chance
  if (Math.random() < 0.7) {
    const { text, index } = pickFragment(fragments.closer, lastUsed.closer);
    parts.push(text);
    nextLastUsed.closer = index;
  }

  return {
    message: parts.join(" "),
    nextLastUsed,
  };
}
