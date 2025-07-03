import { processMessageWithAssistant } from '../../../src/services/openai/processMessageWithAssistant';
import { openai } from '../../../src/services/openai/openai';
import { WeatherTool } from '../../../src/services/weather/weatherTool';

jest.mock('../../../src/services/openai/openai', () => ({
  openai: {
    beta: {
      threads: {
        messages: {
          create: jest.fn(),
          list: jest.fn(),
        },
        runs: {
          create: jest.fn(),
          retrieve: jest.fn(),
          submitToolOutputs: jest.fn(),
        },
      },
    },
  },
}));

jest.mock('../../../src/services/weather/weatherTool', () => {
  return {
    WeatherTool: jest.fn().mockImplementation(() => {
      return {
        handleFunctionCall: jest.fn().mockResolvedValue({
          temperature: 25,
          condition: 'sunny',
        }),
      };
    }),
  };
});

describe('processMessageWithAssistant', () => {
  const threadId = 'thread_123';
  const assistantId = 'assistant_456';
  const content = 'Hello, what is the weather like today?';
  const temperature = 0.7;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process a message and return the assistant response', async () => {
    (openai.beta.threads.messages.create as jest.Mock).mockResolvedValue({
      id: 'msg_123',
      role: 'user',
      content: [{ type: 'text', text: { value: content } }],
    });

    (openai.beta.threads.runs.create as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'queued',
    });

    (openai.beta.threads.runs.retrieve as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'completed',
    });

    (openai.beta.threads.messages.list as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'msg_456',
          role: 'assistant',
          content: [{ type: 'text', text: { value: 'The weather is sunny today!' } }],
        },
      ],
    });

    const result = await processMessageWithAssistant(threadId, assistantId, content, temperature);

    expect(result).toBe('The weather is sunny today!');
  });

  it('should handle tool calls correctly', async () => {
    (openai.beta.threads.messages.create as jest.Mock).mockResolvedValue({
      id: 'msg_123',
      role: 'user',
      content: [{ type: 'text', text: { value: content } }],
    });

    (openai.beta.threads.runs.create as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'queued',
    });

    (openai.beta.threads.runs.retrieve as jest.Mock)
        .mockResolvedValueOnce({
          id: 'run_123',
          status: 'requires_action',
          required_action: {
            type: 'submit_tool_outputs',
            submit_tool_outputs: {
              tool_calls: [
                {
                  id: 'call_123',
                  function: {
                    name: 'get_weather',
                    arguments: JSON.stringify({ location: 'São Paulo' }),
                  },
                },
              ],
            },
          },
        })
        .mockResolvedValueOnce({
          id: 'run_123',
          status: 'completed',
        });

    (openai.beta.threads.messages.list as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'msg_456',
          role: 'assistant',
          content: [{ type: 'text', text: { value: 'The weather in São Paulo is sunny and 25°C.' } }],
        },
      ],
    });

    const result = await processMessageWithAssistant(threadId, assistantId, content, temperature);

    expect(result).toBe('The weather in São Paulo is sunny and 25°C.');
    expect(openai.beta.threads.runs.submitToolOutputs).toHaveBeenCalledWith(
        threadId,
        'run_123',
        {
          tool_outputs: [
            {
              tool_call_id: 'call_123',
              output: JSON.stringify({ temperature: 25, condition: 'sunny' }),
            },
          ],
        }
    );
  });

  it('should throw an error if the run fails', async () => {
    (openai.beta.threads.messages.create as jest.Mock).mockResolvedValue({
      id: 'msg_123',
      role: 'user',
      content: [{ type: 'text', text: { value: content } }],
    });

    (openai.beta.threads.runs.create as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'queued',
    });

    (openai.beta.threads.runs.retrieve as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'failed',
    });

    await expect(processMessageWithAssistant(threadId, assistantId, content, temperature))
        .rejects
        .toThrow('Run não finalizado com sucesso: failed');
  });
});
