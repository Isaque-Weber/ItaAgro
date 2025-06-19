import { processMessageWithAssistant } from '../../../src/services/openai/processMessageWithAssistant';
import { openai } from '../../../src/services/openai/openai';
import { WeatherTool } from '../../../src/services/weather/weatherTool';

// Mock the OpenAI module
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

// Mock the WeatherTool
jest.mock('../../../src/services/weather/weatherTool', () => {
  return {
    WeatherTool: jest.fn().mockImplementation(() => {
      return {
        handleFunctionCall: jest.fn(),
      };
    }),
  };
});

describe('processMessageWithAssistant', () => {
  // Test data
  const threadId = 'thread_123';
  const assistantId = 'assistant_456';
  const content = 'Hello, what is the weather like today?';
  const temperature = 0.7;

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process a message and return the assistant response', async () => {
    // Mock the OpenAI API responses
    (openai.beta.threads.messages.create as jest.Mock).mockResolvedValue({
      id: 'msg_123',
      role: 'user',
      content: [{ type: 'text', text: { value: content } }],
    });

    (openai.beta.threads.runs.create as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'queued',
    });

    // Mock the run status to go directly to completed
    (openai.beta.threads.runs.retrieve as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'completed',
    });

    // Mock the messages list response
    (openai.beta.threads.messages.list as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'msg_456',
          role: 'assistant',
          content: [{ type: 'text', text: { value: 'The weather is sunny today!' } }],
        },
        {
          id: 'msg_123',
          role: 'user',
          content: [{ type: 'text', text: { value: content } }],
        },
      ],
    });

    // Call the function
    const result = await processMessageWithAssistant(threadId, assistantId, content, temperature);

    // Verify the result
    expect(result).toBe('The weather is sunny today!');

    // Verify the OpenAI API was called correctly
    expect(openai.beta.threads.messages.create).toHaveBeenCalledWith(threadId, {
      role: 'user',
      content,
    });

    expect(openai.beta.threads.runs.create).toHaveBeenCalledWith(threadId, {
      assistant_id: assistantId,
      temperature,
      max_completion_tokens: 1000,
    });

    expect(openai.beta.threads.messages.list).toHaveBeenCalledWith(threadId, { limit: 5 });
  });

  it('should handle tool calls correctly', async () => {
    // Mock the OpenAI API responses
    (openai.beta.threads.messages.create as jest.Mock).mockResolvedValue({
      id: 'msg_123',
      role: 'user',
      content: [{ type: 'text', text: { value: content } }],
    });

    (openai.beta.threads.runs.create as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'queued',
    });

    // Mock the run status to require action first, then complete
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

    // Mock the weather tool response
    const mockWeatherResponse = { temperature: 25, condition: 'sunny' };
    const weatherToolInstance = new WeatherTool();
    (weatherToolInstance.handleFunctionCall as jest.Mock).mockResolvedValue(mockWeatherResponse);

    // Mock the messages list response
    (openai.beta.threads.messages.list as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'msg_456',
          role: 'assistant',
          content: [{ type: 'text', text: { value: 'The weather in São Paulo is sunny and 25°C.' } }],
        },
        {
          id: 'msg_123',
          role: 'user',
          content: [{ type: 'text', text: { value: content } }],
        },
      ],
    });

    // Call the function
    const result = await processMessageWithAssistant(threadId, assistantId, content, temperature);

    // Verify the result
    expect(result).toBe('The weather in São Paulo is sunny and 25°C.');

    // Verify the tool outputs were submitted
    expect(openai.beta.threads.runs.submitToolOutputs).toHaveBeenCalledWith(
      threadId,
      'run_123',
      {
        tool_outputs: [
          {
            tool_call_id: 'call_123',
            output: JSON.stringify(mockWeatherResponse),
          },
        ],
      }
    );
  });

  it('should throw an error if the run fails', async () => {
    // Mock the OpenAI API responses
    (openai.beta.threads.messages.create as jest.Mock).mockResolvedValue({
      id: 'msg_123',
      role: 'user',
      content: [{ type: 'text', text: { value: content } }],
    });

    (openai.beta.threads.runs.create as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'queued',
    });

    // Mock the run status to fail
    (openai.beta.threads.runs.retrieve as jest.Mock).mockResolvedValue({
      id: 'run_123',
      status: 'failed',
    });

    // Call the function and expect it to throw
    await expect(processMessageWithAssistant(threadId, assistantId, content, temperature))
      .rejects
      .toThrow('Run não finalizado com sucesso: failed');
  });
});