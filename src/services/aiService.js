const generateTaskDescription = async (title) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return `Task: ${title}. Define objectives, acceptance criteria, and deliverables for this work item.`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You write concise, actionable task descriptions for a project management tool.',
          },
          {
            role: 'user',
            content: `Write a clear task description for a task titled: "${title}"`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content;
  } catch (error) {
    console.error('AI service fallback:', error.message);
    return `Task: ${title}. Define objectives, acceptance criteria, and deliverables for this work item. (AI unavailable: ${error.message})`;
  }
};

module.exports = { generateTaskDescription };
