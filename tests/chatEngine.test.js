const { describe, it } = require('node:test');
const assert = require('node:assert');
const { processIntakeConversation } = require('../src/modules/chat/chat.service');

describe('AI Civic Chat Intake & Triage Engine', () => {
  it('should categorize road crater report and assign proper priority', async () => {
    const messages = [
      {
        role: 'user',
        content: 'There is a huge pothole cluster on the main road that is dangerous for motorcycles.',
      },
    ];

    const result = await processIntakeConversation(messages);
    assert.strictEqual(result.draftReport.suggestedCategory, 'road_damage');
    assert.strictEqual(result.isAiFallback, true);
    assert.ok(result.draftReport.title.length > 0);
    assert.ok(result.draftReport.evidenceChecklist.length > 0);
  });

  it('should classify live electric wire hazard as critical priority', async () => {
    const messages = [
      {
        role: 'user',
        content: 'A live wire is sparking and fell on the street after the storm, severe electric hazard!',
      },
    ];

    const result = await processIntakeConversation(messages);
    assert.strictEqual(result.draftReport.suggestedPriority, 'critical');
    assert.ok(result.draftReport.priorityExplanation.includes('Urgent public safety hazard'));
  });

  it('should classify water pipe bursts correctly', async () => {
    const messages = [
      {
        role: 'user',
        content: 'Drinking water pipeline ruptured and water is flooding the street.',
      },
    ];

    const result = await processIntakeConversation(messages);
    assert.strictEqual(result.draftReport.suggestedCategory, 'water_supply');
  });
});
