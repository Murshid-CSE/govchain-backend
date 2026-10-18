const { prisma } = require('../../config/database');

const CATEGORY_KEYWORDS = {
  road_damage: ['pothole', 'road', 'tar', 'asphalt', 'crater', 'divider', 'footpath', 'traffic signal', 'sidewalk'],
  water_supply: ['water', 'pipe', 'leak', 'drinking water', 'tap', 'pipeline', 'tanker', 'contamination', 'pressure'],
  drainage: ['drain', 'sewage', 'clog', 'gutter', 'manhole', 'overflow', 'stagnant', 'rainwater'],
  waste_management: ['garbage', 'trash', 'waste', 'dump', 'dustbin', 'litter', 'debris', 'dead animal'],
  street_lights: ['light', 'lamp', 'dark', 'bulb', 'pole', 'street light', 'blackout', 'illumination'],
  unsafe_construction: ['building', 'crack', 'collapse', 'scaffolding', 'cement', 'demolition', 'unauthorized', 'beam'],
  corruption: ['bribe', 'extortion', 'scam', 'fraud', 'illegal fee', 'commission'],
  noise: ['loudspeaker', 'noise', 'decibel', 'honking', 'music', 'generator'],
  encroachment: ['encroach', 'pavement', 'illegal shop', 'blocking', 'vendor', 'land grab'],
};

function classifyText(text) {
  const lower = text.toLowerCase();
  let matchedCategory = 'other';
  let maxScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > maxScore) {
      maxScore = score;
      matchedCategory = category;
    }
  }

  // Assess priority
  let priority = 'medium';
  let explanation = 'Standard local public service request requiring departmental review.';

  if (
    lower.includes('electric') ||
    lower.includes('live wire') ||
    lower.includes('collapse') ||
    lower.includes('gas leak') ||
    lower.includes('sparking') ||
    lower.includes('fire hazard')
  ) {
    priority = 'critical';
    explanation = 'Urgent public safety hazard detected requiring immediate 24-hour intervention.';
  } else if (
    lower.includes('overflow') ||
    lower.includes('flooding') ||
    lower.includes('hospital') ||
    lower.includes('school zone') ||
    lower.includes('deep crater')
  ) {
    priority = 'high';
    explanation = 'High-impact civic issue affecting public health, transit, or community safety.';
  } else if (lower.includes('minor') || lower.includes('cosmetic') || lower.includes('paint')) {
    priority = 'low';
    explanation = 'Non-critical maintenance request.';
  }

  return { category: matchedCategory, priority, explanation };
}

async function findPotentialDuplicates(category, text) {
  try {
    const words = text
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 5);

    if (words.length === 0) return [];

    const existingIssues = await prisma.issue.findMany({
      where: {
        category,
        status: { notIn: ['resolved', 'closed', 'rejected'] },
        OR: words.map((word) => ({
          title: { contains: word, mode: 'insensitive' },
        })),
      },
      take: 3,
      select: {
        id: true,
        trackingId: true,
        title: true,
        status: true,
        locationText: true,
        createdAt: true,
      },
    });

    return existingIssues;
  } catch (_err) {
    return [];
  }
}

async function processIntakeConversation(messages) {
  const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content);
  const fullUserText = userMessages.join(' ');

  const { category, priority, explanation } = classifyText(fullUserText);

  // Derive title from the first sentence or first 10 words
  const firstSentence = userMessages[0] ? userMessages[0].split(/[.!?]/)[0].trim() : 'Civic Issue Report';
  const suggestedTitle =
    firstSentence.length > 5 && firstSentence.length <= 100
      ? firstSentence
      : firstSentence.slice(0, 80) + '...';

  // Check potential duplicates
  const duplicates = await findPotentialDuplicates(category, fullUserText);

  return {
    isAiFallback: true,
    draftReport: {
      title: suggestedTitle,
      description: fullUserText,
      suggestedCategory: category,
      suggestedPriority: priority,
      priorityExplanation: explanation,
      evidenceChecklist: [
        'Clear photograph showing the physical issue',
        'Surrounding landmark or road sign photo',
        'Accurate map coordinate or street name',
      ],
      disclaimer:
        'This is an AI-generated draft proposal. You must review, edit, and confirm all fields before official submission.',
    },
    potentialDuplicates: duplicates,
    assistantReply: `I've analyzed your description and prepared an editable draft report for **${category.replace(/_/g, ' ')}** with **${priority}** priority recommendation. Please review and verify the details before submitting.`,
  };
}

module.exports = { processIntakeConversation };
